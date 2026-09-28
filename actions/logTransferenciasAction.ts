"use server"

import prisma from "@/lib/prisma";
import { EnumStatusTransferencia } from "@/app/generated/prisma/enums";
import { bem_patrimonial, log_transferencia, sala } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { getBemByPatrimonio } from "./bensActions";


export interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

export type LogTransferenciaPendente = log_transferencia & {
    bem: bem_patrimonial;
    Local_origem: sala | null;
    Local_destino: sala | null;
}

export async function getLogsTransferenciaPendente(): Promise<ApiResponse<LogTransferenciaPendente[]>> {
    try {
        const logs = await prisma.log_transferencia.findMany({
            where: {
                status_movimentacao: EnumStatusTransferencia.AGUARDANDO_SISPRO
            },
            include: {
                bem: true,
                Local_origem: true,
                Local_destino: true
            }
        });

        revalidatePath("/pendencias");

        return {
            data: logs,
            status: 200,
            message: "Transferências pendentes carregadas com sucesso",
        };
    } catch (error) {
        console.error("Erro ao carregar transferências pendentes:", error);
        return {
            data: [],
            status: 500,
            message: "Erro ao carregar transferências pendentes",
        };
    }

}

export async function postLogTransferencia(codigo_patrimonial: string, local_destino: string) : Promise<ApiResponse<log_transferencia | null>> {
    try {

        const bem = await getBemByPatrimonio(codigo_patrimonial);

        if (!bem || !bem.data) {
            return {
                data: null,
                status: 404,
                message: "Bem não encontrado",
            };
        }

        const log = await prisma.log_transferencia.create({
            data: {
                id_bem: bem.data.id,
                id_local_destino: parseInt(local_destino),
                id_local_origem: bem.data.id_local,
                status_movimentacao: EnumStatusTransferencia.AGUARDANDO_SISPRO
            }
        });

        revalidatePath("/pendencias");

        return {
            data: log,
            status: 200,
            message: "Transferência criada com sucesso",
        };
    } catch (error) {
        console.error("Erro ao criar transferência:", error);
        return {
            data: null,
            status: 500,
            message: "Erro ao criar transferência",
        };
    }
}

