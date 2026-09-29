"use server"

import { sala, User } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

const bcrypt = require('bcrypt');


export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export type UserSemSenha = Omit<User, 'password'>;


export async function postUsuario(formData: FormData): Promise<ApiResponse<User | null>> {
    try {
        const nome = formData.get('nome') as string;
        const email = formData.get('email') as string;
        const senha = formData.get('senha') as string;

        if (!nome || !email || !senha) {
            return {
                data: null,
                status: 400,
                message: 'Todos os campos são obrigatórios!'
            };
        }

        const hashPassword = await bcrypt.hash(senha, 10);

        const usuario = await prisma.user.create({
            data: {
                name: nome,
                email: email.toLowerCase(),
                password: hashPassword,
            }
        });
        
        return {
            data: usuario,
            status: 201,
            message: 'Usuário criado com sucesso!'
        };
    } catch (error) {
        console.log(error);
        return {
            data: null,
            status: 500,
            message: 'Erro ao criar usuário!'
        };
    }
}

export async function getAllUsers(): Promise<ApiResponse<UserSemSenha[] | null>> {
    try {
        const users = await prisma.user.findMany(
            {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        );
        return {
            data: users,
            status: 200,
            message: 'Usuários obtidos com sucesso!'
        };
    } catch (error) {
        console.log(error);
        return {
            data: null,
            status: 500,
            message: 'Erro ao obter usuários!'
        };
    }
}