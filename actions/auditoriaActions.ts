"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiResponse } from "./logTransferenciasAction";
import { AuditoriaAggregateArgs } from "@/app/generated/prisma/models";
import { Auditoria, EnumEscolas, ItemAuditado, Prisma, StatusEtiqueta, StatusLeitura } from "@/app/generated/prisma/client";
import { BemComLocal, getAllBens, patchLocaldoBem } from "./bensActions";

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
    statusSala: 'CONCLUIDA' | 'PENDENTE' | 'VAZIA';
}

export type MapaSalas = {
    salasPendentes: SalaMapeada[];
    salasConcluidas: SalaMapeada[];
    salasVazias: SalaMapeada[];
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

export async function putAuditoria(auditoriaId: string, fields: Prisma.AuditoriaUpdateInput): Promise<ApiResponse<boolean | null>> {
    try {
        const auditoria = await prisma.auditoria.update({
            where: {
                id: auditoriaId
            },
            data: fields
        })

        if (!auditoria) {
            return {
                data: null,
                status: 500,
                message: "Erro ao atualizar auditoria",
            };
        }

        revalidatePath(`/auditoria/${auditoriaId}/mapa`);
        revalidatePath("/auditoria");

        return {
            data: true,
            status: 200,
            message: "Auditoria atualizada com sucesso",
        };

    } catch (error) {
        console.error("Erro ao atualizar auditoria:", error);
        return {
            data: null,
            status: 500,
            message: "Erro ao atualizar auditoria",
        };
    }
}

export async function getMapaSalas(auditoriaId: string): Promise<ApiResponse<MapaSalas>> {
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

            const SalaMapeada: SalaMapeada = {
                salaId: sala.id.toString(),
                salaDescricao: sala.descricao,
                salaEscola: sala.escola,
                totalBens: totalEsperado,
                totalLidosOk,
                progresso: 0,
                statusSala: 'VAZIA',
            }

            if (totalEsperado === 0) {
                return SalaMapeada;
            }

            const progresso = Math.round((totalLidosOk / totalEsperado) * 100);

            SalaMapeada.progresso = progresso;
            SalaMapeada.statusSala = progresso === 100 ? "CONCLUIDA" : 'PENDENTE';

            return SalaMapeada;
        })

        const salasPendentes: SalaMapeada[] = mapa.filter(sala => sala.statusSala == 'PENDENTE');
        const salasConcluidas: SalaMapeada[] = mapa.filter(sala => sala.statusSala == 'CONCLUIDA');
        const salasVazias: SalaMapeada[] = mapa.filter(sala => sala.statusSala == 'VAZIA');

        return {
            data: {
                salasConcluidas: salasConcluidas,
                salasPendentes: salasPendentes,
                salasVazias: salasVazias
            },
            status: 200,
            message: "Mapa de salas buscado com sucesso"
        }


    } catch (error) {
        console.error("Erro ao buscar mapas de salas:", error);
        return {
            data: {
                salasConcluidas: [],
                salasPendentes: [],
                salasVazias: [],
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

export async function registrarItemAuditado(
    auditoriaId: string,
    salaId: number,
    bemId: number,
    statusEtiqueta: StatusEtiqueta = StatusEtiqueta.OK
): Promise<ApiResponse<ItemAuditado | null>> {
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
        if (!usuarioId || isNaN(usuarioId)) {
            if (session.user.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true }
                });
                if (dbUser) usuarioId = dbUser.id;
            }
        }

        if (!usuarioId || isNaN(usuarioId)) {
            return {
                data: null,
                status: 400,
                message: "Identificador de usuário inválido ou não encontrado",
            };
        }

        const bem = await prisma.bem_patrimonial.findUnique({
            where: { id: bemId },
            include: { Local: true }
        });



        if (!bem) {
            return {
                data: null,
                status: 404,
                message: "Bem patrimonial não encontrado",
            };
        }

        // Verifica se o bem pertence à sala onde foi lido
        const isNaSalaCorreta = bem.id_local === salaId;
        const statusLeitura = isNaSalaCorreta ? StatusLeitura.OK : StatusLeitura.MOVIMENTADO;

        if (!isNaSalaCorreta) {
            console.log("iniciando atualização do bem")
            const mudaLocal = await patchLocaldoBem(bem.codigo_patrimonial!, salaId.toString());
            console.log("atualização do bem concluida")
            console.log(mudaLocal.data)

            if (!mudaLocal) {
                return {
                    data: null,
                    status: 500,
                    message: "Erro ao atualizar local do bem",
                };
            }
        }

        // Upsert do item auditado
        const itemAuditado = await prisma.itemAuditado.upsert({
            where: {
                auditoria_id_bem_patrimonial_id: {
                    auditoria_id: auditoriaId,
                    bem_patrimonial_id: bemId,
                }
            },
            update: {
                sala_id: salaId,
                status_leitura: statusLeitura,
                status_etiqueta: statusEtiqueta,
                usuario_id: usuarioId,
                data_verificacao: new Date(),
            },
            create: {
                auditoria_id: auditoriaId,
                sala_id: salaId,
                bem_patrimonial_id: bemId,
                status_leitura: statusLeitura,
                status_etiqueta: statusEtiqueta,
                usuario_id: usuarioId,
            }
        });

        const msg = isNaSalaCorreta
            ? `Bem ${bem.codigo_patrimonial} validado com sucesso!`
            : `Atenção: Bem ${bem.codigo_patrimonial} cadastrado em "${bem.Local?.descricao || 'Outra sala'}", registrado como MOVIMENTADO!`;

        
        revalidatePath(`/auditorias/${salaId}/mapa`)
        revalidatePath(`/auditorias/${salaId}/mapa/${salaId}`)
        revalidatePath(`/auditorias/${salaId}/mapa/${salaId}/leitor`)
        return {
            data: itemAuditado,
            status: 200,
            message: msg,
        };
    } catch (error) {
        console.error("Erro ao registrar leitura do bem:", error);
        return {
            data: null,
            status: 500,
            message: "Erro ao registrar leitura do bem",
        };
    }
}


