"use server"

import prisma from "@/lib/prisma";
import { EnumStatusTransferencia } from "@/app/generated/prisma/enums";
import { bem_patrimonial, log_transferencia, sala } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";


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

export async function getLogTransferenciaPendente(): Promise<ApiResponse<LogTransferenciaPendente[]>> {
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


