"use server";

import prisma from "@/lib/prisma";
import type { bem_patrimonial, sala } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

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


export async function patchLocaldoBem(codigo_patrimonial: string, local_id: string): Promise<ApiResponse<BemComLocal | null>> {
  try {
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