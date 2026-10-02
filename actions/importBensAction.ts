"use server";



import { readFile } from 'node:fs/promises';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { bem_patrimonial, EnumCategoriaBem, EnumEscolas, EnumStatusBem, sala } from '../app/generated/prisma/client';
import { BemComLocal, getAllBens, getAllSalas, getSalaByWhere } from '../actions/bensActions';
import path from 'node:path';

type BensParaAtualizar = {
    codigo_patrimonial: string,
    id_local: number
}


async function extractBens(pathname: string, saveArray: BemComLocal[]) {
    console.clear();

    try {
        const buffer = await readFile(pathname);

        const encoding: string | null = chardet.detect(buffer);
        console.log(`Encoding: `, encoding);

        if (!encoding) { throw new Error('Não foi possível detectar o encoding do arquivo'); }

        const content = iconv.decode(buffer, encoding);

        let lines = content.split(/\r?\n/);


        lines.map((line, index) => {
            const codigo_patrimonial = line.substring(0, 6).trim();
            const descricao_bem = line.substring(6, 76).trim();

            let local_codigo = line.substring(79, 94).trim();

            if (local_codigo === '39 - PROC_BAIXA') { local_codigo = '- PROC_BAIXA'}

            saveArray.push({
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

        console.log('Total de linhas lidas: ', lines.length);
        console.log("Quantidade de bens extraídos: ", saveArray.length);

    } catch (error) {
        console.error("Erro ao ler arquivo: ", error);
    }
}

async function compareBens(bensExtraidos: BemComLocal[], bensExistentes: BemComLocal[], bensParaAtualizar: BensParaAtualizar[]) {

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

        if ( bemExistente.Local?.codigo_sispro === bemExtraido.Local?.codigo_sispro ) { return null };

        bensParaAtualizar.push({
            id_local: bemExtraido.id_local!,
            codigo_patrimonial: bemExistente.codigo_patrimonial!,
        })
    })



    console.log('Bens que precisam ser atualizados: ', bensParaAtualizar.length);
    console.table(bensParaAtualizar)
}

export async function mainImport() {
    const pathToFile = path.join(process.cwd(), 'scripts', 'bens.txt');
    let bensExtraidos: BemComLocal[] = [];
    await extractBens(pathToFile, bensExtraidos);

    let bensExistentes: BemComLocal[] = await getAllBens().then(res => res.data);
    console.log('Bens já existentes no sistema: ', bensExistentes.length);

    let bensParaAtualizar: BensParaAtualizar[] = [];
    await compareBens(bensExtraidos, bensExistentes, bensParaAtualizar);

}





