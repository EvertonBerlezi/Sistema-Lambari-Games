const { abrirBanco } = require("./index");
async function popular(db) {
  const m = db.models;
  await db.transacao(async () => {
    const o = db.options();
    if (await m.jogos.count(o))
      throw Error(
        "O catálogo já possui jogos. A demonstração não altera dados existentes.",
      );
    async function ref(t, nome) {
      const [r] = await m[t].findOrCreate({
        ...o,
        where: { nome },
        defaults: { nome },
      });
      return r.id;
    }
    const plataformas = {
      PC: await ref("plataformas", "PC"),
      PS5: await ref("plataformas", "PlayStation 5"),
      Switch: await ref("plataformas", "Nintendo Switch"),
    };
    const generos = {
      RPG: await ref("generos", "RPG"),
      Aventura: await ref("generos", "Aventura"),
      Simulacao: await ref("generos", "Simulação"),
      Acao: await ref("generos", "Ação"),
    };
    const demos = [
      [
        "Elden Ring",
        "PS5",
        "RPG",
        "Bandai Namco",
        29990,
        24990,
        5,
        1245620,
        "Explore as Terras Intermédias em uma aventura de fantasia e ação.",
      ],
      [
        "Hollow Knight",
        "PC",
        "Aventura",
        "Team Cherry",
        4699,
        null,
        8,
        367520,
        "Desvende os mistérios de um reino esquecido em uma aventura desenhada à mão.",
      ],
      [
        "Stardew Valley",
        "Switch",
        "Simulacao",
        "ConcernedApe",
        5990,
        null,
        12,
        413150,
        "Construa sua vida no campo, cuide da fazenda e descubra a comunidade do vale.",
      ],
      [
        "Hades",
        "PC",
        "Acao",
        "Supergiant Games",
        7399,
        5990,
        3,
        1145360,
        "Desafie o submundo nesta aventura de ação inspirada na mitologia grega.",
      ],
      [
        "Terraria",
        "PC",
        "Aventura",
        "Re-Logic",
        3299,
        null,
        0,
        105600,
        "Cave, construa e explore um mundo de possibilidades.",
      ],
      [
        "Baldur’s Gate 3",
        "PS5",
        "RPG",
        "Larian Studios",
        29990,
        null,
        4,
        1086940,
        "Reúna seu grupo e embarque em uma jornada de escolhas e descobertas.",
      ],
      [
        "Celeste",
        "Switch",
        "Aventura",
        "Maddy Makes Games",
        5990,
        4490,
        6,
        504230,
        "Uma jornada de superação por uma montanha cheia de desafios.",
      ],
      [
        "Dead Cells",
        "PC",
        "Acao",
        "Motion Twin",
        5999,
        null,
        2,
        588650,
        "Explore um castelo em constante mudança e descubra novas habilidades.",
      ],
    ];
    for (const [
      titulo,
      plataforma,
      genero,
      distribuidora,
      preco,
      promocao,
      quantidade,
      steam,
      descricao,
    ] of demos) {
      const j = await m.jogos.create(
        {
          titulo,
          descricao,
          plataforma_id: plataformas[plataforma],
          genero_id: generos[genero],
          distribuidora_id: await ref("distribuidoras", distribuidora),
          preco_centavos: preco,
          promocao_centavos: promocao,
          capa_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steam}/library_600x900_2x.jpg`,
        },
        o,
      );
      await m.estoque.create({ jogo_id: j.id, quantidade }, o);
    }
    for (const [nome, site] of [
      ["IGN", "https://www.ign.com"],
      ["Metacritic", "https://www.metacritic.com"],
    ])
      await m.criticos.findOrCreate({
        ...o,
        where: { nome },
        defaults: { nome, site },
      });
  });
}
if (require.main === module) {
  const db = abrirBanco();
  db.migrar()
    .then(() => popular(db))
    .then(() =>
      console.log(
        "Demonstração criada. Preços e estoques ilustrativos; nenhuma nota foi inventada.",
      ),
    )
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => db.close());
}
module.exports = { popular };
