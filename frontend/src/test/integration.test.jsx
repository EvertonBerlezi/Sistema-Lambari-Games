import { beforeAll, afterAll, it, expect } from "vitest";
import { createRequire } from "node:module";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
const require = createRequire(import.meta.url);
let s, server, base, refs;
const originalFetch = globalThis.fetch;
beforeAll(async () => {
  // Destino separado e explicitamente descartável; jamais utiliza o banco da loja.
  require("../../../backend/node_modules/dotenv").config({
    path: new URL("../../../backend/.env", import.meta.url).pathname,
    quiet: true,
  });
  if (process.env.TEST_UI_DATABASE_URL) {
    if (!new URL(process.env.TEST_UI_DATABASE_URL).pathname.endsWith("_test"))
      throw Error("Use banco terminado em _test.");
    process.env.DATABASE_URL = process.env.TEST_UI_DATABASE_URL;
  } else {
    delete process.env.DATABASE_URL;
    process.env.DB_NAME = "lambari_games_ui_test";
  }
  s = require("../../../backend/src/services/authService");
  await s.db.migrar();
  await s.db.sequelize.query(
    "TRUNCATE sessoes,desejos,avaliacoes,estoque,jogos,criticos,distribuidoras,generos,plataformas,usuarios RESTART IDENTITY CASCADE",
  );
  await s.cadastrar(
    {
      nome: "Admin integração",
      email: "admin@integracao.test",
      senha: "senha-teste-123",
      perfil: "admin",
    },
    null,
    true,
  );
  await require("../../../backend/src/database/demo").popular(s.db);
  refs = {
    plataforma: (await s.listar("plataformas"))[0].id,
    genero: (await s.listar("generos"))[0].id,
    distribuidora: (await s.listar("distribuidoras"))[0].id,
  };
  server = require("../../../backend/src/app").listen(0, "127.0.0.1");
  await new Promise((r, j) => {
    server.once("listening", r);
    server.once("error", j);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  globalThis.fetch = (path, options) =>
    originalFetch(
      typeof path === "string" && path.startsWith("/") ? base + path : path,
      options,
    );
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
}, 20000);
afterAll(async () => {
  globalThis.fetch = originalFetch;
  if (server) await new Promise((r) => server.close(r));
  if (s) await s.db.close();
});
it("React → HTTP → PostgreSQL: login, criação/edição, estoque, desejos e logout", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: "Ver detalhes de Elden Ring" });
  await user.click(
    screen.getByRole("button", { name: "Abrir menu do usuário" }),
  );
  await user.click(screen.getByRole("link", { name: /Entrar na conta/ }));
  await user.type(screen.getByLabelText("Email"), "admin@integracao.test");
  await user.type(
    screen.getByLabelText("Senha", { exact: true }),
    "senha-teste-123",
  );
  await user.click(screen.getByRole("button", { name: "Entrar", exact: true }));
  await user.click(
    await screen.findByRole("link", { name: "Administração", exact: true }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Novo registro" }),
  );
  await user.type(screen.getByLabelText("Título"), "Jogo integração web");
  await user.selectOptions(
    screen.getByLabelText("Plataforma"),
    String(refs.plataforma),
  );
  await user.selectOptions(
    screen.getByLabelText("Gênero"),
    String(refs.genero),
  );
  await user.selectOptions(
    screen.getByLabelText("Distribuidora"),
    String(refs.distribuidora),
  );
  await user.type(screen.getByLabelText("Preço normal (R$)"), "120,00");
  await user.click(screen.getByRole("button", { name: "Salvar registro" }));
  await screen.findByRole("cell", { name: "Jogo integração web" });
  const j = (await s.catalogo({ busca: "Jogo integração web" }))[0];
  expect(j.preco_centavos).toBe(12000);
  await user.click(
    screen.getByRole("button", { name: "Editar registro " + j.id }),
  );
  await user.clear(screen.getByLabelText("Preço normal (R$)"));
  await user.type(screen.getByLabelText("Preço normal (R$)"), "90,00");
  await user.click(screen.getByRole("button", { name: "Salvar registro" }));
  await waitFor(async () =>
    expect((await s.detalhe(j.id)).preco_centavos).toBe(9000),
  );
  await user.click(screen.getByRole("link", { name: "Estoque", exact: true }));
  await user.click(
    await screen.findByRole("button", { name: "Novo registro" }),
  );
  await user.selectOptions(screen.getByLabelText("Jogo"), String(j.id));
  await user.type(screen.getByLabelText("Quantidade disponível"), "2");
  await user.click(screen.getByRole("button", { name: "Salvar registro" }));
  await waitFor(async () => expect((await s.detalhe(j.id)).quantidade).toBe(2));
  await user.click(screen.getByRole("link", { name: "Catálogo", exact: true }));
  await screen.findByRole("button", {
    name: "Ver detalhes de Jogo integração web",
  });
  await user.click(
    screen.getByRole("button", {
      name: "Adicionar Jogo integração web da lista de desejos",
    }),
  );
  await screen.findByRole("button", {
    name: "Remover Jogo integração web da lista de desejos",
  });
  await user.click(
    screen.getByRole("link", { name: "Lista de desejos", exact: true }),
  );
  await screen.findByRole("heading", { name: "Jogo integração web" });
  await user.click(
    screen.getByRole("button", {
      name: "Editar observação de Jogo integração web",
    }),
  );
  await user.type(
    screen.getByLabelText("Observação"),
    "Separar para conferir na loja",
  );
  await user.click(screen.getByRole("button", { name: "Salvar", exact: true }));
  await waitFor(async () =>
    expect((await s.desejos(1))[0].observacao).toBe(
      "Separar para conferir na loja",
    ),
  );
  await user.click(
    screen.getByRole("button", { name: "Abrir menu do usuário" }),
  );
  await user.click(screen.getByRole("button", { name: "Sair da conta" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("link", { name: "Administração", exact: true }),
    ).not.toBeInTheDocument(),
  );
  expect(sessionStorage.getItem("lambari_token")).toBeNull();
}, 25000);
