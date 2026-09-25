const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');

// Caminhos dos arquivos TXT
const LOCAL1_PATH = path.join(__dirname, '..', 'app', 'local1.txt');
const LOCAL2_PATH = path.join(__dirname, '..', 'app', 'LOCAL2.txt');
const BENS_PATH = path.join(__dirname, '..', 'app', 'bens.txt');
const SQL_OUTPUT_PATH = path.join(__dirname, '..', 'supabase_seed.sql');

// Função auxiliar para remover acentos na análise de categoria
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

// Categorização inteligente dos bens baseada na descrição
function categorizarBem(descricao) {
  const d = removeAccents(descricao);

  // ELETRONICOS: computadores, telas, redes, som, telecom, etc.
  if (/MICRO|NOTEBOOK|COMPUTADOR|DESKTOP|MONITOR|SWITCH|ROTEADOR|RACK|ESTABILIZADOR|NOBREAK|TECLADO|MOUSE|PROJETOR|TELA DE PROJECAO|IMPRESSORA|SCANNER|SERVIDOR|TABLET|WEBCAM|CAMERA|FONE|AUDIO|SOM|CAIXA DE SOM|AMPLIFICADOR|MICROFONE|TELEVISAO|TELEVISOR|TV|SMARTPHONE|CELULAR|HD |MEMORIA|PLACA|FONTE|DISPLAY|VIDEO|RECEPTOR|DVR|CENTRAL TELEFONICA|TELEFONE|RADIO|LEITOR/.test(d)) {
    return 'ELETRONICOS';
  }

  // MOVEIS: armários, mesas, cadeiras, estantes, gaveteiros, etc.
  if (/ARMARIO|MESA|CADEIRA|ESTANTE|GAVETEIRO|BALCAO|POLTRONA|SOFA|LONGARINA|BANQUETA|SUPORTE|LIXEIRA|QUADRO BRANCO|QUADRO|FLIP SHARP|MURAL|CABIDEIRO|CARRINHO|ARQUIVO|ROUPEIRO|PRATELEIRA|BANCADA/.test(d)) {
    return 'MOVEIS';
  }

  // MATERIAL_ESCRITORIO: perfuradores, grampeadores, etc.
  if (/GRAMPEADOR|PERFURADOR|PORTA |CALCULADORA|FRAGMENTADORA|PLASTIFICADORA|ENCADERNADORA|RELOGIO DE PAREDE|TESOURA/.test(d)) {
    return 'MATERIAL_ESCRITORIO';
  }

  // EQUIPAMENTOS: ar condicionado, refrigeradores, microondas, ventiladores, ferramentas, etc.
  return 'EQUIPAMENTOS';
}

function parseLocal1() {
  if (!fs.existsSync(LOCAL1_PATH)) {
    console.warn(`[Aviso] Arquivo ${LOCAL1_PATH} não encontrado.`);
    return { codigo: '39', nome: 'SENAC SÃO LEOPOLDO' };
  }
  const content = fs.readFileSync(LOCAL1_PATH, 'latin1').trim();
  const codigo = content.substring(0, 2).trim();
  const nome = content.substring(2).trim();
  return { codigo, nome };
}

function parseLocal2() {
  if (!fs.existsSync(LOCAL2_PATH)) {
    throw new Error(`Arquivo não encontrado: ${LOCAL2_PATH}`);
  }
  const lines = fs.readFileSync(LOCAL2_PATH, 'latin1').split(/\r?\n/).filter(Boolean);
  const salas = [];

  for (const line of lines) {
    const codigo = line.substring(0, 15).trim();
    const descricao = line.substring(15).trim();
    if (!codigo || !descricao) continue;

    // Se na descrição contém TECNOSINOS, pertence à unidade Unisinos, caso contrário Centro
    const escola = /TECNOSINOS/i.test(descricao) ? 'UNISINOS' : 'CENTRO';

    salas.push({
      codigo,
      descricao,
      escola,
    });
  }

  return salas;
}

function parseBens() {
  if (!fs.existsSync(BENS_PATH)) {
    throw new Error(`Arquivo não encontrado: ${BENS_PATH}`);
  }
  const lines = fs.readFileSync(BENS_PATH, 'latin1').split(/\r?\n/).filter(Boolean);
  const bens = [];

  for (const line of lines) {
    if (line.length < 94) continue;

    const codigo_patrimonial = line.substring(0, 6).trim();
    const descricao_bem = line.substring(6, 76).trim();
    const local_codigo = line.substring(78, 94).trim();
    const identificacao_interna = '-';
    const categoria = categorizarBem(descricao_bem);

    // Se o local for processo de baixa, status = BAIXADO, senão ATIVO
    const status = local_codigo === '39 - PROC_BAIXA' ? 'BAIXADO' : 'ATIVO';

    bens.push({
      codigo_patrimonial,
      descricao_bem,
      identificacao_interna,
      categoria,
      local_codigo,
      status,
    });
  }

  return bens;
}

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateSqlScript(unidade, salas, bens) {
  let sql = `-- ==========================================================================\n`;
  sql += `-- SCRIPT DE MIGRAÇÃO / IMPORTAÇÃO PARA O SUPABASE\n`;
  sql += `-- Unidade: ${unidade.codigo} - ${unidade.nome}\n`;
  sql += `-- Gerado a partir dos arquivos: local1.txt, LOCAL2.txt e bens.txt\n`;
  sql += `-- Total de Salas: ${salas.length} | Total de Bens: ${bens.length}\n`;
  sql += `-- ==========================================================================\n\n`;
  sql += `BEGIN;\n\n`;

  sql += `-- 1. Tabela Temporária para Mapeamento dos Códigos dos Locais\n`;
  sql += `CREATE TEMP TABLE IF NOT EXISTS _temp_locais (\n`;
  sql += `    codigo VARCHAR(50) PRIMARY KEY,\n`;
  sql += `    descricao TEXT NOT NULL,\n`;
  sql += `    escola "EnumEscolas" NOT NULL,\n`;
  sql += `    sala_id INT\n`;
  sql += `) ON COMMIT DROP;\n\n`;

  sql += `-- 2. Inserção dos dados das Salas de LOCAL2.txt na tabela temporária\n`;
  sql += `INSERT INTO _temp_locais (codigo, descricao, escola) VALUES\n`;
  const salaValues = salas.map(s => 
    `  (${escapeSqlString(s.codigo)}, ${escapeSqlString(s.descricao)}, ${escapeSqlString(s.escola)}::"EnumEscolas")`
  );
  sql += salaValues.join(',\n') + ';\n\n';

  sql += `-- 3. Inserção ou atualização das Salas na tabela oficial "sala"\n`;
  sql += `-- Evita duplicações caso a sala já tenha sido inserida com a mesma descrição\n`;
  sql += `INSERT INTO "sala" ("descricao", "escola")\n`;
  sql += `SELECT t.descricao, t.escola\n`;
  sql += `FROM _temp_locais t\n`;
  sql += `WHERE NOT EXISTS (\n`;
  sql += `    SELECT 1 FROM "sala" s WHERE s.descricao = t.descricao\n`;
  sql += `);\n\n`;

  sql += `-- 4. Vincular o sala_id gerado com cada código de local\n`;
  sql += `UPDATE _temp_locais t\n`;
  sql += `SET sala_id = s.id\n`;
  sql += `FROM "sala" s\n`;
  sql += `WHERE s.descricao = t.descricao;\n\n`;

  sql += `-- 5. Inserção dos Bens Patrimoniais de bens.txt\n`;
  sql += `-- Mapeando o id_local automaticamente através do código da sala\n`;
  
  // Dividir inserção de bens em blocos de 500 para fácil execução no Supabase SQL Editor
  const chunkSize = 500;
  for (let i = 0; i < bens.length; i += chunkSize) {
    const chunk = bens.slice(i, i + chunkSize);
    sql += `-- Lote ${Math.floor(i / chunkSize) + 1} de ${Math.ceil(bens.length / chunkSize)} (${chunk.length} bens)\n`;
    sql += `INSERT INTO "bem_patrimonial" (\n`;
    sql += `    "codigo_patrimonial",\n`;
    sql += `    "descricao_bem",\n`;
    sql += `    "identificacao_interna",\n`;
    sql += `    "categoria",\n`;
    sql += `    "id_local",\n`;
    sql += `    "status"\n`;
    sql += `)\nVALUES\n`;

    const bensValues = chunk.map(b => {
      const idLocalSql = `(SELECT sala_id FROM _temp_locais WHERE codigo = ${escapeSqlString(b.local_codigo)})`;
      return `  (${escapeSqlString(b.codigo_patrimonial)}, ${escapeSqlString(b.descricao_bem)}, ${escapeSqlString(b.identificacao_interna)}, ${escapeSqlString(b.categoria)}::"EnumCategoriaBem", ${idLocalSql}, ${escapeSqlString(b.status)}::"EnumStatusBem")`;
    });

    sql += bensValues.join(',\n');
    sql += `\nON CONFLICT ("codigo_patrimonial") DO UPDATE SET\n`;
    sql += `    "descricao_bem" = EXCLUDED."descricao_bem",\n`;
    sql += `    "categoria" = EXCLUDED."categoria",\n`;
    sql += `    "id_local" = EXCLUDED."id_local",\n`;
    sql += `    "status" = EXCLUDED."status";\n\n`;
  }

  sql += `COMMIT;\n\n`;
  sql += `-- ==========================================================================\n`;
  sql += `-- Consulta para verificar a importação realizada com sucesso:\n`;
  sql += `-- SELECT COUNT(*) as total_salas FROM "sala";\n`;
  sql += `-- SELECT categoria, COUNT(*) FROM "bem_patrimonial" GROUP BY categoria;\n`;
  sql += `-- SELECT status, COUNT(*) FROM "bem_patrimonial" GROUP BY status;\n`;
  sql += `-- ==========================================================================\n`;

  return sql;
}

async function executeDirectImport(unidade, salas, bens) {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('[Info] Nenhuma variável DATABASE_URL ou DIRECT_URL encontrada no .env. Pulando inserção direta.');
    return;
  }

  console.log('\n[Conexão] Conectando diretamente ao Supabase Postgres...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[Conexão] Conectado com sucesso ao Supabase!');

    await client.query('BEGIN');

    // 1. Inserir ou recuperar Salas
    console.log(`[Salas] Processando ${salas.length} salas de LOCAL2.txt...`);
    const codigoToIdMap = new Map();

    for (const sala of salas) {
      // Verifica se já existe
      const existing = await client.query('SELECT id FROM "sala" WHERE descricao = $1', [sala.descricao]);
      let salaId;
      if (existing.rows.length > 0) {
        salaId = existing.rows[0].id;
      } else {
        const inserted = await client.query(
          'INSERT INTO "sala" (descricao, escola) VALUES ($1, $2) RETURNING id',
          [sala.descricao, sala.escola]
        );
        salaId = inserted.rows[0].id;
      }
      codigoToIdMap.set(sala.codigo, salaId);
    }
    console.log(`[Salas] Concluído! Todas as ${salas.length} salas mapeadas.`);

    // 2. Inserir Bens em batches
    console.log(`[Bens] Inserindo ${bens.length} bens patrimoniais em lotes...`);
    const batchSize = 250;
    let inseridos = 0;

    for (let i = 0; i < bens.length; i += batchSize) {
      const batch = bens.slice(i, i + batchSize);
      
      const values = [];
      const queryParams = [];
      let paramIndex = 1;

      for (const b of batch) {
        const idLocal = codigoToIdMap.get(b.local_codigo) || null;
        queryParams.push(
          b.codigo_patrimonial,
          b.descricao_bem,
          b.identificacao_interna,
          b.categoria,
          idLocal,
          b.status
        );
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}::"EnumCategoriaBem", $${paramIndex + 4}, $${paramIndex + 5}::"EnumStatusBem")`);
        paramIndex += 6;
      }

      const queryText = `
        INSERT INTO "bem_patrimonial" (
          codigo_patrimonial,
          descricao_bem,
          identificacao_interna,
          categoria,
          id_local,
          status
        )
        VALUES ${values.join(', ')}
        ON CONFLICT (codigo_patrimonial) DO UPDATE SET
          descricao_bem = EXCLUDED.descricao_bem,
          categoria = EXCLUDED.categoria,
          id_local = EXCLUDED.id_local,
          status = EXCLUDED.status;
      `;

      await client.query(queryText, queryParams);
      inseridos += batch.length;
      process.stdout.write(`  -> Progresso: ${inseridos}/${bens.length} bens processados...\r`);
    }

    await client.query('COMMIT');
    console.log(`\n[Bens] Sucesso! ${bens.length} bens inseridos/atualizados no Supabase.`);

    // Estatísticas finais
    const statSalas = await client.query('SELECT count(*) FROM "sala"');
    const statBens = await client.query('SELECT count(*) FROM "bem_patrimonial"');
    const statCategorias = await client.query('SELECT categoria, count(*) FROM "bem_patrimonial" GROUP BY categoria');
    const statStatus = await client.query('SELECT status, count(*) FROM "bem_patrimonial" GROUP BY status');

    console.log('\n================ RESUMO NO SUPABASE ================');
    console.log(`Total de Salas no banco: ${statSalas.rows[0].count}`);
    console.log(`Total de Bens no banco:  ${statBens.rows[0].count}`);
    console.log('\nBens por Categoria:');
    statCategorias.rows.forEach(r => console.log(`  - ${r.categoria.padEnd(20)}: ${r.count}`));
    console.log('\nBens por Status:');
    statStatus.rows.forEach(r => console.log(`  - ${r.status.padEnd(20)}: ${r.count}`));
    console.log('====================================================\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n[Erro] Falha durante a importação direta no Supabase:', err);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('====================================================');
  console.log('   IMPORTADOR DE TXT PARA SUPABASE (SISPRO/SENAC)   ');
  console.log('====================================================');

  const args = process.argv.slice(2);
  const sqlOnly = args.includes('--sql-only');

  // 1. Extração dos dados dos TXTs
  const unidade = parseLocal1();
  console.log(`[Unidade] ${unidade.codigo} - ${unidade.nome}`);

  const salas = parseLocal2();
  console.log(`[Salas] ${salas.length} salas encontradas em LOCAL2.txt`);

  const bens = parseBens();
  console.log(`[Bens] ${bens.length} bens patrimoniais encontrados em bens.txt`);

  // 2. Geração do arquivo SQL legível para o Supabase
  console.log('\n[SQL] Gerando arquivo SQL para o Supabase...');
  const sqlContent = generateSqlScript(unidade, salas, bens);
  fs.writeFileSync(SQL_OUTPUT_PATH, sqlContent, 'utf8');
  console.log(`[SQL] Arquivo SQL gerado com sucesso em: ${SQL_OUTPUT_PATH}`);

  // 3. Execução direta no Supabase se não for --sql-only
  if (sqlOnly) {
    console.log('[Info] Flag --sql-only fornecida. Apenas o arquivo SQL foi gerado.');
  } else {
    await executeDirectImport(unidade, salas, bens);
  }

  console.log('Concluído com sucesso!');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
