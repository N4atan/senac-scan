"use server";

import prisma from "@/lib/prisma";
import { EnumStatusTransferencia, type bem_patrimonial, type Prisma, type sala } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { postLogTransferencia } from "./logTransferenciasAction";
import { BensParaAtualizar } from "./importBensAction";

export type BemComLocal = bem_patrimonial & {
  Local: sala | null;
};

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export async function getAllBens(): Promise<ApiResponse<BemComLocal[]>> {
  try {
    const bens = await prisma.bem_patrimonial.findMany({
      include: {
        Local: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    revalidatePath("/");
    return {
      data: bens,
      status: 200,
      message: "Bens carregados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao carregar bens:", error);
    return {
      data: [],
      status: 500,
      message: "Erro ao carregar bens",
    };
  }
}

export async function getBemByPatrimonio(codigo_patrimonial: string): Promise<ApiResponse<BemComLocal | null>> {
  try {
    const bem = await prisma.bem_patrimonial.findUnique({
      where: {
        codigo_patrimonial: codigo_patrimonial,
      },
      include: {
        Local: true,
      },
    });

    if (!bem) {
      return {
        data: null,
        status: 404,
        message: "Bem não encontrado",
      };
    }

    revalidatePath("/leitor");
    return {
      data: bem,
      status: 200,
      message: "Bem carregado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao carregar bem:", error);
    return {
      data: null,
      status: 500,
      message: "Erro ao carregar bem",
    };
  }
}

export async function getAllSalas(): Promise<ApiResponse<sala[]>> {
  try {
    const salas = await prisma.sala.findMany();
    return {
      data: salas,
      status: 200,
      message: "Salas carregadas com sucesso",
    };
  } catch (error) {
    console.error("Erro ao carregar salas:", error);
    return {
      data: [],
      status: 500,
      message: "Erro ao carregar salas",
    };
  }
}

export async function getSalaByWhere(where: Prisma.salaWhereUniqueInput): Promise<ApiResponse<sala | null>> {
  try {
    const sala = await prisma.sala.findUnique({
      where,
    });

    if (!sala) {
      return {
        data: null,
        status: 404,
        message: "Sala não encontrada",
      };
    }
    return {
      data: sala,
      status: 200,
      message: "Sala carregada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao carregar salas:", error);
    return {
      data: null,
      status: 500,
      message: "Erro ao carregar salas",
    };
  }
}






export async function patchLocaldoBem(codigo_patrimonial: string, local_id: string): Promise<ApiResponse<BemComLocal | null>> {
  try {

    const log = await postLogTransferencia(codigo_patrimonial, local_id);

    if (!log) {
      return {
        data: null,
        status: 500,
        message: "Erro ao criar log",
      };
    }


    const bem = await prisma.bem_patrimonial.update({
      where: {
        codigo_patrimonial: codigo_patrimonial,
      },
      data: {
        id_local: parseInt(local_id),
      },
      include: {
        Local: true,
      },
    });



    revalidatePath("/leitor");
    revalidatePath("/pendencias");
    revalidatePath("/");

    return {
      data: bem,
      status: 200,
      message: "Bem atualizado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar bem:", error);
    return {
      data: null,
      status: 500,
      message: "Erro ao atualizar bem",
    };
  }
}

export async function patchLocaldosBens(logs: BensParaAtualizar[]): Promise<ApiResponse<boolean | null>> {
  try {
    if (!logs || logs.length === 0) {
      return {
        data: false,
        status: 200,
        message: "Nenhum bem para atualizar",
      };
    }
    // 1. Cria TODOS os logs com UMA ÚNICA query INSERT no banco
    const logsData = logs.map((item) => ({
      id_bem: item.bem.id,
      id_local_origem: item.bem.id_local,
      id_local_destino: item.new_local.id,
      status_movimentacao: EnumStatusTransferencia.AGUARDANDO_SISPRO,
    }));
    await prisma.log_transferencia.createMany({
      data: logsData,
    });
    // 2. Executa os updates dos bens em pedaços (chunks de 50)
    // Assim cada transação leva menos de 1 segundo!
    const CHUNK_SIZE = 50;
    for (let i = 0; i < logs.length; i += CHUNK_SIZE) {
      const chunk = logs.slice(i, i + CHUNK_SIZE);
      const chunkUpdates = chunk.map((item) =>
        prisma.bem_patrimonial.update({
          where: { id: item.bem.id },
          data: { id_local: item.new_local.id },
        })
      );
      await prisma.$transaction(chunkUpdates, {
        maxWait: 5000,
        timeout: 10000,
      });
    }
    revalidatePath("/sincronizar");
    revalidatePath("/pendencias");
    revalidatePath("/");
    return {
      data: true,
      status: 200,
      message: "Bens e transferências atualizados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar bens e criar logs:", error);
    return {
      data: null,
      status: 500,
      message: "Erro ao atualizar bens",
    };
  }
}