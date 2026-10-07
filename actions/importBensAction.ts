"use server";



import { readFile } from 'node:fs/promises';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { bem_patrimonial, EnumCategoriaBem, EnumEscolas, EnumStatusBem, sala } from '../app/generated/prisma/client';
import { BemComLocal, getAllBens, getAllSalas, getSalaByWhere } from '../actions/bensActions';
import path from 'node:path';
import { ApiResponse } from './usuariosAction';

export type BensParaAtualizar = {
    bem: BemComLocal,
    new_local: sala,
}


async function extractBens(buffer: Buffer): Promise<BemComLocal[]> {
    const bensExtraidos: BemComLocal[] = [];

    try {

        const encoding: string | null = chardet.detect(buffer);
        // console.log(`Encoding: `, encoding);

        if (!encoding) { throw new Error('Não foi possível detectar o encoding do arquivo'); }

        const content = iconv.decode(buffer, encoding);

        let lines = content.split(/\r?\n/);


        lines.map((line, index) => {
            const codigo_patrimonial = line.substring(0, 6).trim();
            const descricao_bem = line.substring(6, 76).trim();

            let local_codigo = line.substring(79, 94).trim();

            if (local_codigo === '39 - PROC_BAIXA') { local_codigo = '- PROC_BAIXA' }

            bensExtraidos.push({
                id: index,
                codigo_patrimonial,
                identificacao_interna: '',
                descricao_bem,
                categoria: EnumCategoriaBem.ELETRONICOS,
                Local: {
                    codigo_sispro: local_codigo,
                    descricao: '',
                    id: 0,
                    escola: EnumEscolas.CENTRO
                },
                id_local: null,
                status: EnumStatusBem.ATIVO,
            })
        })

        // console.log('Total de linhas lidas: ', lines.length);
        // console.log("Quantidade de bens extraídos: ", bensExtraidos.length);

        return bensExtraidos;

    } catch (error) {
        console.error("Erro ao ler arquivo: ", error);
        throw new Error("Não foi possível extrair os bens do arquivo.");
    }
}

async function compareBens(bensExtraidos: BemComLocal[]): Promise<BensParaAtualizar[]> {
    let bensParaAtualizar: BensParaAtualizar[] = [];

    try {
        const bensExistentes: BemComLocal[] = await getAllBens().then(res => res.data);
        const salas: sala[] = await getAllSalas().then(res => res.data);

        bensExtraidos.map(bemExtraido => {
            const salaExtraida = salas.find(sala => sala.codigo_sispro === bemExtraido.Local?.codigo_sispro)
            if (!salaExtraida) { return null; }
            bemExtraido.id_local = salaExtraida.id;
            bemExtraido.Local = salaExtraida;
        })

        bensExistentes.map(bemExistente => {

            const bemExtraido = bensExtraidos.find(bem => bem.codigo_patrimonial === bemExistente.codigo_patrimonial)

            if (!bemExtraido) { return null };

            if (bemExistente.Local?.codigo_sispro === bemExtraido.Local?.codigo_sispro) { return null };

            bensParaAtualizar.push({
                new_local: salas.find(sala => sala.codigo_sispro === bemExtraido.Local?.codigo_sispro)!, 
                bem: bemExistente,
            })
        })
        
        // console.log('Bens que precisam ser atualizados: ', bensParaAtualizar.length);
        // console.table(bensParaAtualizar)

        return bensParaAtualizar;

    } catch (error) {
        console.error("Erro ao comparar bens: ", error);
        throw new Error("Não foi possível comparar os bens.");
    }
}


export async function mainImport(formData: FormData): Promise<ApiResponse<BensParaAtualizar[]>> {

    const file = formData.get("file") as File | null;
    if (!file) {
        throw new Error("Nenhum arquivo enviado.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let bensExtraidos: BemComLocal[] = await extractBens(buffer);

    let bensParaAtualizar: BensParaAtualizar[] = await compareBens(bensExtraidos);

    return {
        data: bensParaAtualizar,
        status: 200,
        message: "Bens prontos para serem atualizados",
    };

}





