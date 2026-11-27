const { Op, fn, col, where } = require("sequelize");
const { abrirBanco } = require("../src/database");
const catalogo = require("../data-catalogo/jogos.json");

/** Adiciona somente jogos ausentes. Preserva preços, estoque e edição de registros existentes. */
async function carregarCatalogo(db) {
  const m = db.models;
  const resultado = {
    base: catalogo.jogos.length,
    adicionados: 0,
    preservados: 0,
    avaliacoes: 0,
  };
  await db.transacao(async () => {
    const opts = db.options();
    await db.sequelize.query("SELECT pg_advisory_xact_lock(88216003)", opts);
    async function referencia(tabela, nome, extras = {}) {
      let registro = await m[tabela].findOne({
        ...opts,
        where: where(fn("LOWER", col("nome")), nome.toLowerCase()),
      });
      if (!registro)
        registro = await m[tabela].create({ nome, ...extras }, opts);
      return registro.id;
    }
    const plataforma_id = await referencia("plataformas", "PC");
    for (const [indice, item] of catalogo.jogos.entries()) {
      const existente = await m.jogos.findOne({
        ...opts,
        where: {
          plataforma_id,
          [Op.and]: where(
            fn("LOWER", col("titulo")),
            item.titulo.toLowerCase(),
          ),
        },
      });
      if (existente) {
        resultado.preservados++;
        continue;
      }
      // Valores determinísticos para exercitar filtros, sem representar a loja ou preços da Steam.
      const preco = [5990, 9990, 14990, 19990, 24990, 29990][indice % 6];
      const promocao = indice % 4 === 0 ? preco - 2000 : null;
      const quantidade = indice % 7 === 0 ? 0 : 1 + (indice % 12);
      const jogo = await m.jogos.create(
        {
          titulo: item.titulo,
          descricao: item.descricao,
          capa_url: item.capa_url,
          plataforma_id,
          genero_id: await referencia("generos", item.genero),
          distribuidora_id: await referencia(
            "distribuidoras",
            item.distribuidora,
          ),
          preco_centavos: preco,
          promocao_centavos: promocao,
          dados_demonstracao: true,
          fonte_url: item.fonte_url,
          fonte_consultada_em: item.consultado_em,
        },
        opts,
      );
      await m.estoque.create({ jogo_id: jogo.id, quantidade }, opts);
      if (
        item.metacritic &&
        Number.isFinite(item.metacritic.nota) &&
        item.metacritic.nota >= 0 &&
        item.metacritic.nota <= 100
      ) {
        const critico_id = await referencia("criticos", "Metacritic", {
          site: "https://www.metacritic.com",
        });
        await m.avaliacoes.create(
          {
            jogo_id: jogo.id,
            critico_id,
            nota: item.metacritic.nota,
            url: item.metacritic.url,
          },
          opts,
        );
        resultado.avaliacoes++;
      }
      resultado.adicionados++;
    }
  });
  return resultado;
}
if (require.main === module) {
  const db = abrirBanco();
  db.migrar()
    .then(() => carregarCatalogo(db))
    .then((r) => {
      console.log(
        `Base: ${r.base} jogos de PC. Adicionados: ${r.adicionados}. Existentes preservados: ${r.preservados}.`,
      );
      console.log(
        `Avaliações Metacritic informadas pela Steam: ${r.avaliacoes}.`,
      );
      console.log(
        "ATENÇÃO: preços, promoções e estoques adicionados são de demonstração e estão identificados no catálogo.",
      );
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => db.close());
}
module.exports = { carregarCatalogo };
