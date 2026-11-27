const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const { spawn } = require("node:child_process");
require("dotenv").config({ path: resolve(__dirname, "../.env"), quiet: true });
// Banco exclusivo de testes. O banco de uso normal nunca é truncado.
if (process.env.TEST_DATABASE_URL) {
  const u = new URL(process.env.TEST_DATABASE_URL);
  if (!u.pathname.endsWith("_test"))
    throw Error(
      "TEST_DATABASE_URL deve apontar para um banco terminado em _test.",
    );
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  delete process.env.DATABASE_URL;
  process.env.DB_NAME = "lambari_games_test";
}
const s = require("../src/services/authService");
const { popular } = require("../src/database/demo");
let server, base, admin, cliente, outro;
before(async () => {
  await s.db.migrar();
  await s.db.sequelize.query(
    "TRUNCATE sessoes,desejos,avaliacoes,estoque,jogos,criticos,distribuidoras,generos,plataformas,usuarios RESTART IDENTITY CASCADE",
  );
  server = require("../src/app").listen(0, "127.0.0.1");
  await new Promise((r, j) => {
    server.once("listening", r);
    server.once("error", j);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await s.db.close();
});
async function http(path, method = "GET", body, token) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, data: r.status === 204 ? null : await r.json() };
}
async function token(email) {
  return (await s.login(email, "senha1234")).token;
}
test("migração repetível e banco PostgreSQL real", async () => {
  await s.db.migrar();
  const [r] = await s.db.sequelize.query("SELECT version()");
  assert.match(r[0].version, /PostgreSQL/);
  assert.equal((await http("/saude")).data.banco, "PostgreSQL");
});
test("bootstrap administrativo, contas públicas e hash de senha", async () => {
  admin = await s.cadastrar(
    {
      nome: "Administrador",
      email: "admin@teste.com",
      senha: "senha1234",
      perfil: "admin",
    },
    null,
    true,
  );
  cliente = await s.cadastrar({
    nome: "Cliente",
    email: "cliente@teste.com",
    senha: "senha1234",
  });
  outro = await s.cadastrar({
    nome: "Outro",
    email: "outro@teste.com",
    senha: "senha1234",
  });
  assert.equal(admin.senha, undefined);
  assert.notEqual((await s.existe("usuarios", admin.id)).senha, "senha1234");
  await assert.rejects(() =>
    s.cadastrar(
      {
        nome: "Admin2",
        email: "admin2@teste.com",
        senha: "senha1234",
        perfil: "admin",
      },
      null,
      true,
    ),
  );
  const r = await http("/cadastro", "POST", {
    nome: "Cadastro",
    email: "cadastro@teste.com",
    senha: "senha1234",
    perfil: "admin",
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.perfil, "cliente");
  await assert.rejects(() =>
    s.cadastrar({
      nome: "Repete",
      email: "ADMIN@TESTE.COM",
      senha: "senha1234",
    }),
  );
});
test("permissões reais e sessão inválida ou expirada", async () => {
  assert.equal((await http("/admin/jogos")).status, 401);
  const t = await token("cliente@teste.com");
  assert.equal((await http("/admin/jogos", "POST", {}, t)).status, 403);
  assert.equal(
    (
      await http("/login", "POST", {
        email: "cliente@teste.com",
        senha: "errada",
      })
    ).status,
    401,
  );
  await s.logout(t);
  assert.equal((await http("/conta", "GET", undefined, t)).status, 401);
  const novo = await token("cliente@teste.com");
  await s.m.sessoes.update(
    { expira: 0 },
    { where: { usuario_id: cliente.id } },
  );
  await assert.rejects(() => s.autenticarToken(novo));
});
test("CRUD HTTP de todos os cadastros auxiliares e mensagens de vínculo", async () => {
  const t = await token("admin@teste.com");
  for (const tipo of ["plataformas", "generos", "distribuidoras", "criticos"]) {
    const r = await http(
      "/admin/" + tipo,
      "POST",
      { nome: "Temp " + tipo, site: "https://exemplo.com" },
      t,
    );
    assert.equal(r.status, 201);
    assert.equal(
      (
        await http(
          "/admin/" + tipo + "/" + r.data.id,
          "PATCH",
          { nome: "Editado " + tipo },
          t,
        )
      ).status,
      200,
    );
    assert.ok((await http("/" + tipo)).data.some((x) => x.id === r.data.id));
    assert.equal(
      (await http("/admin/" + tipo + "/" + r.data.id, "DELETE", undefined, t))
        .status,
      204,
    );
  }
  const r = await http(
    "/admin/jogos",
    "POST",
    {
      titulo: "Inválido",
      plataforma_id: 9999,
      genero_id: 9999,
      distribuidora_id: 9999,
      preco_centavos: 1000,
    },
    t,
  );
  assert.equal(r.status, 404);
  assert.match(r.data.mensagem, /Plataforma.*9999/);
});
test("demonstração PostgreSQL e catálogo público com filtros múltiplos", async () => {
  await popular(s.db);
  const jogos = await s.catalogo();
  assert.equal(jogos.length, 8);
  assert.equal(jogos[0].avaliacoes.length, 0);
  const refs = await s.listar("plataformas");
  const ids = refs.map((r) => r.id);
  const r = await http("/jogos?plataforma_id=" + ids.join(","));
  assert.equal(r.status, 200);
  assert.equal(r.data.length, 8);
  assert.equal((await s.catalogo({ busca: "elden" }))[0].titulo, "Elden Ring");
  assert.equal((await s.catalogo({ busca: "%" })).length, 0);
  assert.ok(
    (await s.catalogo({ disponivel: true, promocao: true })).every(
      (j) => j.quantidade > 0 && j.promocao_centavos !== null,
    ),
  );
  assert.equal((await http("/jogos?disponivel=invalido")).status, 400);
  assert.equal((await http("/jogos?plataforma_id=abc")).status, 400);
});
test("CRUD jogo e estoque, validações e exclusão de vínculo bloqueada", async () => {
  const a = admin.id,
    p = (await s.listar("plataformas"))[0],
    g = (await s.listar("generos"))[0],
    d = (await s.listar("distribuidoras"))[0];
  const j = await s.salvar(a, "jogos", {
    titulo: "Jogo CRUD",
    plataforma_id: p.id,
    genero_id: g.id,
    distribuidora_id: d.id,
    preco_centavos: 10000,
  });
  const t = await token("admin@teste.com");
  assert.equal(
    (await http("/admin/plataformas/" + p.id, "DELETE", undefined, t)).status,
    400,
  );
  const e = await s.salvar(a, "estoque", { jogo_id: j.id, quantidade: 5 });
  await s.salvar(a, "estoque", { quantidade: 3 }, e.id);
  assert.equal((await s.detalhe(j.id)).quantidade, 3);
  await assert.rejects(() => s.salvar(a, "estoque", { quantidade: -1 }, e.id));
  await assert.rejects(() => s.salvar(a, "estoque", { quantidade: 1.5 }, e.id));
  await s.salvar(a, "jogos", { promocao_centavos: 7500 }, j.id);
  assert.equal((await s.detalhe(j.id)).preco_atual_centavos, 7500);
  await assert.rejects(() =>
    s.salvar(a, "jogos", { promocao_centavos: 10000 }, j.id),
  );
  await s.salvar(a, "jogos", { promocao_centavos: null }, j.id);
  assert.equal((await s.detalhe(j.id)).promocao_centavos, null);
  await s.excluir(a, "estoque", e.id);
  assert.equal((await s.detalhe(j.id)).quantidade, 0);
  await s.excluir(a, "jogos", j.id);
});
test("avaliações, médias reais e escala de nota", async () => {
  const j = (await s.catalogo())[0],
    c = (await s.listar("criticos"))[0];
  const a = await s.salvar(admin.id, "avaliacoes", {
    jogo_id: j.id,
    critico_id: c.id,
    nota: 90,
    url: "https://exemplo.com/critica",
  });
  assert.equal((await s.detalhe(j.id)).nota_media, 90);
  await s.salvar(admin.id, "avaliacoes", { nota: 85 }, a.id);
  assert.equal((await s.detalhe(j.id)).nota_media, 85);
  await assert.rejects(() =>
    s.salvar(admin.id, "avaliacoes", { nota: 101 }, a.id),
  );
  await assert.rejects(() =>
    s.salvar(admin.id, "avaliacoes", { url: "javascript:alert(1)" }, a.id),
  );
  await s.excluir(admin.id, "avaliacoes", a.id);
  assert.equal((await s.detalhe(j.id)).nota_media, null);
});
test("lista privada: criar, editar, excluir e cascata", async () => {
  const j = (await s.catalogo())[0],
    d = await s.salvarDesejo(cliente.id, {
      jogo_id: j.id,
      observacao: "Aguardar oferta",
    });
  assert.equal((await s.desejos(outro.id)).length, 0);
  await assert.rejects(() =>
    s.salvarDesejo(outro.id, { observacao: "Invadir" }, d.id),
  );
  await assert.rejects(() => s.excluirDesejo(outro.id, d.id));
  await s.salvarDesejo(cliente.id, { observacao: "" }, d.id);
  assert.equal((await s.desejos(cliente.id))[0].observacao, "");
  await s.excluirDesejo(cliente.id, d.id);
  assert.equal((await s.desejos(cliente.id)).length, 0);
  const t = await token("cliente@teste.com");
  assert.equal(
    (await http("/desejos", "POST", { jogo_id: j.id }, t)).status,
    201,
  );
  assert.equal(
    (await http("/desejos", "POST", { jogo_id: j.id }, t)).status,
    400,
  );
  await s.excluir(admin.id, "jogos", j.id);
  assert.equal((await s.desejos(cliente.id)).length, 0);
});
test("conta, preferências, usuários e proteção do último administrador", async () => {
  await s.atualizarConta(cliente.id, {
    nome: "Novo nome",
    preferencias: { tema: "escuro", somente_disponiveis: true },
  });
  assert.equal((await s.usuario(cliente.id)).preferencias.tema, "escuro");
  await assert.rejects(() =>
    s.atualizarConta(cliente.id, { preferencias: { tema: "azul" } }),
  );
  await assert.rejects(() =>
    s.atualizarConta(cliente.id, { senha: "nova12345", senha_atual: "errada" }),
  );
  const t = await token("cliente@teste.com");
  await s.atualizarConta(cliente.id, {
    senha_atual: "senha1234",
    senha: "nova12345",
  });
  await assert.rejects(() => s.autenticarToken(t));
  assert.ok(await s.login("cliente@teste.com", "nova12345"));
  await assert.rejects(() => s.excluirUsuario(admin.id, admin.id));
  await assert.rejects(() =>
    s.atualizarUsuario(admin.id, admin.id, { perfil: "cliente" }),
  );
  await s.atualizarUsuario(admin.id, outro.id, {
    nome: "Nome alterado",
    perfil: "admin",
  });
  assert.equal((await s.usuario(outro.id)).perfil, "admin");
  await s.atualizarUsuario(admin.id, outro.id, { perfil: "cliente" });
  await s.excluirUsuario(admin.id, outro.id);
  await assert.rejects(() => s.usuario(outro.id));
});
test("persistência depois de reabrir conexão PostgreSQL", async () => {
  const { abrirBanco } = require("../src/database"),
    db = abrirBanco();
  try {
    await db.sequelize.authenticate();
    assert.ok(await db.models.jogos.count());
  } finally {
    await db.close();
  }
});
test("compatibilidade do terminal com o serviço assíncrono", async () => {
  const child = spawn(
    process.execPath,
    [resolve(__dirname, "../src/cli/index.js")],
    { env: process.env },
  );
  let out = "",
    err = "";
  child.stdout.on("data", (b) => {
    out += b;
    if (out.includes("Opção:")) child.stdin.end("0\n");
  });
  child.stderr.on("data", (b) => (err += b));
  const code = await new Promise((r) => child.on("close", r));
  assert.equal(code, 0, err);
  assert.match(out, /LAMBARI GAMES/);
});

test("base de 50 jogos: importação repetível, origem e preservação dos dados da loja", async () => {
  const { carregarCatalogo } = require("../scripts/catalogo");
  const base = require("../data-catalogo/jogos.json");
  const antigo = await s.m.jogos.findOne({
    where: { titulo: "Hollow Knight" },
  });
  await s.salvar(
    admin.id,
    "jogos",
    { preco_centavos: 12345, promocao_centavos: null },
    antigo.id,
  );
  const estoque = await s.m.estoque.findOne({ where: { jogo_id: antigo.id } });
  await s.salvar(admin.id, "estoque", { quantidade: 123 }, estoque.id);
  const antes = await s.m.jogos.count();
  const r = await carregarCatalogo(s.db);
  assert.equal(r.base, 50);
  assert.ok(r.adicionados > 0);
  assert.equal(await s.m.jogos.count(), antes + r.adicionados);
  assert.equal((await s.detalhe(antigo.id)).preco_centavos, 12345);
  assert.equal((await s.detalhe(antigo.id)).quantidade, 123);
  const novo = (await s.catalogo({ busca: "Cyberpunk" }))[0];
  assert.equal(novo.dados_demonstracao, true);
  assert.match(novo.capa_url, /^\/capas\/steam-\d+\.jpg$/);
  assert.match(novo.fonte_url, /store.steampowered.com/);
  const verificado = base.jogos.find((j) => j.titulo === novo.titulo);
  assert.equal(novo.avaliacoes[0].nota, verificado.metacritic.nota);
  assert.equal(novo.avaliacoes[0].url, verificado.metacritic.url);
  await s.salvar(
    admin.id,
    "jogos",
    { descricao: "Descrição revisada pela loja" },
    novo.id,
  );
  assert.equal((await s.detalhe(novo.id)).capa_url, novo.capa_url);
  const segunda = await carregarCatalogo(s.db);
  assert.equal(segunda.adicionados, 0);
  assert.equal(segunda.preservados, 50);
  assert.equal(
    (await s.detalhe(novo.id)).descricao,
    "Descrição revisada pela loja",
  );
  await s.salvar(admin.id, "jogos", { dados_demonstracao: false }, novo.id);
  assert.equal((await s.detalhe(novo.id)).dados_demonstracao, false);
});
