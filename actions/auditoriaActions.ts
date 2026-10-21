"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiResponse } from "./logTransferenciasAction";
import { AuditoriaAggregateArgs } from "@/app/generated/prisma/models";
import { Auditoria, EnumEscolas, ItemAuditado, StatusLeitura } from "@/app/generated/prisma/client";
import { BemComLocal, getAllBens } from "./bensActions";

export type AuditoriaComBens = Auditoria & {
    itensAuditados: ItemAuditado[];
}

export type SalaMapeada = {
    salaId: string;
    salaDescricao: string;
    salaEscola: EnumEscolas;
    totalBens: number;
    totalLidosOk: number;
    progresso: number;
    statusSala: 'CONCLUIDA' | 'PENDENTE';
}

export type ListaParaLeitura = {
    bensLeituraOk: BemComLocal[];
    bensLeituraMovimentado: BemComLocal[];
    bensLeituraPendente: BemComLocal[];
}

export async function postAuditoria(titulo: string): Promise<ApiResponse<boolean | null>> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return {
                data: null,
                status: 401,
                message: "Usuário não autenticado",
            };
        }

        let usuarioId = Number((session.user as any)?.id);

        // Fallback: se o ID não veio no token JWT da sessão, busca pelo e-mail
        if (!usuarioId || isNaN(usuarioId)) {
            if (session.user.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true }
                });
                if (dbUser) {
                    usuarioId = dbUser.id;
                }
            }
        }

        if (!usuarioId || isNaN(usuarioId)) {
            return {
                data: null,
                status: 400,
                message: "Identificador de usuário inválido ou não encontrado",
            };
        }

        const auditoria = await prisma.auditoria.create({
            data: {
                titulo,
                usuario: {
                    connect: { id: usuarioId },
                },
            },
        });

        if (!auditoria) {
            return {
                data: null,
                status: 500,
                message: "Erro ao criar auditoria",
            };
        }

        revalidatePath("/auditoria");

        return {
            data: true,
            status: 200,
            message: "Auditoria criada com sucesso",
        };

    } catch (error) {
        console.error("Erro ao criar auditoria:", error);
        return {
            data: null,
            status: 500,
            message: "Erro ao criar auditoria",
        };
    }
}

export async function getAllAuditorias() {
    try {
        const auditorias = await prisma.auditoria.findMany({
            include: {
                itensAuditados: true
            }
        });
        return auditorias;
    } catch (error) {
        console.error("Erro ao buscar auditorias:", error);
        return [];
    }
}


export async function getMapaSalas(auditoriaId: string): Promise<ApiResponse<{ salasPendentes: SalaMapeada[]; salasConcluidas: SalaMapeada[] }>> {
    try {

        const salas = await prisma.sala.findMany({
            include: {
                bens: true,
                itens_auditados: {
                    where: { auditoria_id: auditoriaId }
                }
            }
        })

        const mapa: SalaMapeada[] = salas.map((sala) => {

            const totalEsperado = sala.bens.length;

            const totalLidosOk = sala.itens_auditados.filter(item => item.status_leitura === StatusLeitura.OK).length;

            const progresso = totalEsperado > 0
                ? Math.round((totalLidosOk / totalEsperado) * 100)
                : 100;

            return {
                salaId: sala.id.toString(),
                salaDescricao: sala.descricao,
                salaEscola: sala.escola,
                totalBens: totalEsperado,
                totalLidosOk,
                progresso,
                statusSala: progresso === 100 ? "CONCLUIDA" : 'PENDENTE'
            }
        })

        const salasPendentes: SalaMapeada[] = mapa.filter(sala => sala.statusSala == 'PENDENTE');
        const salasConcluidas: SalaMapeada[] = mapa.filter(sala => sala.statusSala == 'CONCLUIDA');

        return {
            data: {
                salasConcluidas: salasConcluidas,
                salasPendentes: salasPendentes
            },
            status: 200,
            message: "Mapa de salas buscado com sucesso"
        }


    } catch (error) {
        console.error("Erro ao buscar mapas de salas:", error);
        return {
            data: {
                salasConcluidas: [],
                salasPendentes: []
            },
            status: 500,
            message: "Erro ao buscar mapas de salas"
        }
    }

}


export async function getListaParaLeitura(salaId: string, auditoriaId: string): Promise<ApiResponse<ListaParaLeitura>> {
    try {
        const bensCadastradosNaSala = await prisma.bem_patrimonial.findMany({
            where: {
                id_local: parseInt(salaId),
            },
            include: {
                Local: true,
            },
            orderBy: {
                id: "asc",
            },
        });

        if (!bensCadastradosNaSala || bensCadastradosNaSala.length === 0) {
            return {
                data: {
                    bensLeituraOk: [],
                    bensLeituraMovimentado: [],
                    bensLeituraPendente: []
                },
                status: 404,
                message: "Nenhum bem encontrado para a sala informada",
            };
        }

        const itensAuditados = await prisma.itemAuditado.findMany({
            where: {
                auditoria_id: auditoriaId,
                bem_patrimonial_id: {
                    in: bensCadastradosNaSala.map(bem => bem.id)
                }
            }
        });

        const idsBensAuditados = new Set(itensAuditados.map(i => i.bem_patrimonial_id));

        const leiturasOk = itensAuditados.filter(item => item.status_leitura === StatusLeitura.OK);
        const leiturasMovimentado = itensAuditados.filter(item => item.status_leitura === StatusLeitura.MOVIMENTADO);

        const bensLeituraOk: BemComLocal[] = bensCadastradosNaSala.filter(bens => leiturasOk.some(item => item.bem_patrimonial_id === bens.id));
        const bensLeituraMovimentado: BemComLocal[] = bensCadastradosNaSala.filter(bens => leiturasMovimentado.some(item => item.bem_patrimonial_id === bens.id));
        const bensLeituraPendente: BemComLocal[] = bensCadastradosNaSala.filter(bens => !idsBensAuditados.has(bens.id));
        
        
        
        return {
            data: {
                bensLeituraOk,
                bensLeituraMovimentado,
                bensLeituraPendente
            },
            status: 200,
            message: "Lista de bens carregada com sucesso",
        };


    } catch (error) {
        console.error("Erro ao buscar a lista de bens:", error);
        return {
            data: {
                bensLeituraOk: [],
                bensLeituraMovimentado: [],
                bensLeituraPendente: []
            },
            status: 500,
            message: "Erro ao buscar a lista de bens"
        };
    }
}