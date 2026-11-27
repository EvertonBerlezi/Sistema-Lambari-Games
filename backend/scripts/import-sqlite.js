// Executar somente para transportar dados da versão anterior, sem alterar sua origem.
const { DatabaseSync } = require("node:sqlite");
const { resolve } = require("node:path");
const { existsSync } = require("node:fs");
const { abrirBanco } = require("../src/database");
(async () => {
  const arquivo = process.argv[2];
  if (!arquivo || !existsSync(resolve(arquivo)))
    throw Error("Uso: npm run db:import-sqlite -- /caminho/lambari.sqlite");
  const origem = new DatabaseSync(resolve(arquivo), { readOnly: true }),
    db = abrirBanco();
  try {
    await db.migrar();
    const tabelas = [
      "usuarios",
      "plataformas",
      "generos",
      "distribuidoras",
      "criticos",
      "jogos",
      "estoque",
      "avaliacoes",
      "desejos",
    ];
    await db.transacao(async () => {
      for (const t of tabelas)
        if (await db.models[t].count(db.options()))
          throw Error(
            "O PostgreSQL de destino deve estar vazio. Não importe sobre cadastros existentes.",
          );
      for (const t of tabelas) {
        const rows = origem.prepare(`SELECT * FROM ${t} ORDER BY id`).all();
        for (const r of rows) {
          if (t === "usuarios" && typeof r.preferencias === "string")
            r.preferencias = JSON.parse(r.preferencias);
          await db.models[t].create(r, db.options());
        }
        await db.sequelize.query(
          `SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE(MAX(id),1), COUNT(*)>0) FROM ${t}`,
          db.options(),
        );
        console.log(`${t}: ${rows.length} registro(s)`);
      }
    });
    console.log(
      "Importação concluída. Sessões não foram transportadas; entre novamente.",
    );
  } finally {
    origem.close();
    await db.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
