import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Catalog from "../pages/Catalog";
import Auth from "../pages/Auth";
import Admin from "../pages/Admin";
import Wishes from "../pages/Wishes";
import Account from "../pages/Account";
import { api, centavos } from "../lib/api";
const { context } = vi.hoisted(() => ({ context: {} }));
vi.mock("../context/AppContext", () => ({ useApp: () => context }));
vi.mock("../lib/api", async (original) => ({
  ...(await original()),
  api: vi.fn(),
}));
const game = {
  id: 7,
  titulo: "Jogo de teste",
  plataforma: "PC",
  genero: "Aventura",
  distribuidora: "Distribuidora",
  plataforma_id: 1,
  genero_id: 1,
  distribuidora_id: 1,
  preco_centavos: 12000,
  promocao_centavos: null,
  preco_atual_centavos: 12000,
  quantidade: 5,
  nota_media: null,
  avaliacoes: [],
};
function mount(node, path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={node} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(context, {
    user: {
      id: 1,
      nome: "Admin",
      email: "admin@teste.com",
      perfil: "admin",
      preferencias: {},
    },
    refs: {
      plataformas: [{ id: 1, nome: "PC" }],
      generos: [{ id: 1, nome: "Aventura" }],
      distribuidoras: [{ id: 1, nome: "Distribuidora" }],
      criticos: [{ id: 1, nome: "IGN" }],
    },
    refsError: "",
    refreshRefs: vi.fn().mockResolvedValue(),
    notify: vi.fn(),
    login: vi.fn().mockResolvedValue(),
    setUser: vi.fn(),
  });
  api.mockImplementation(async (path) =>
    path === "/jogos" ? [game] : path.startsWith("/jogos?") ? [game] : [],
  );
});
describe("Formulários e fluxos do frontend", () => {
  it("consulta pública, detalhe e seleção de filtros pelo nome", async () => {
    context.user = null;
    const user = userEvent.setup();
    mount(<Catalog />);
    await screen.findByRole("button", {
      name: "Ver detalhes de Jogo de teste",
    });
    expect(screen.getByText("R$ 120,00")).toBeInTheDocument();
    await user.click(screen.getByLabelText("PC"));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.stringContaining("plataforma_id=1"),
        expect.anything(),
      ),
    );
    await user.click(
      screen.getByRole("button", { name: "Ver detalhes de Jogo de teste" }),
    );
    expect(screen.getByText("Estoque na loja")).toBeInTheDocument();
    expect(screen.getByText("5 unidade(s)")).toBeInTheDocument();
  });
  it("cadastro impede confirmação de senha divergente", async () => {
    const user = userEvent.setup();
    mount(<Auth register />);
    await user.type(screen.getByLabelText("Nome"), "Cliente");
    await user.type(screen.getByLabelText("Email"), "cliente@teste.com");
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "senha1234",
    );
    await user.type(screen.getByLabelText(/Confirmar senha/), "outra1234");
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "As senhas não conferem",
    );
    expect(context.login).not.toHaveBeenCalled();
  });
  it("cria jogo com selects e converte reais em centavos", async () => {
    const user = userEvent.setup();
    mount(
      <Routes>
        <Route path="/admin/:tipo" element={<Admin />} />
      </Routes>,
      "/admin/jogos",
    );
    await screen
      .findByRole("cell", { name: "Jogo de teste" })
      .catch(() => null);
    await user.click(screen.getByRole("button", { name: "Novo registro" }));
    await user.type(screen.getByLabelText("Título"), "Minecraft");
    await user.selectOptions(screen.getByLabelText("Plataforma"), "1");
    await user.selectOptions(screen.getByLabelText("Gênero"), "1");
    await user.selectOptions(screen.getByLabelText("Distribuidora"), "1");
    await user.type(screen.getByLabelText("Preço normal (R$)"), "120,00");
    await user.click(screen.getByRole("button", { name: "Salvar registro" }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/admin/jogos", {
        method: "POST",
        body: expect.objectContaining({
          titulo: "Minecraft",
          plataforma_id: 1,
          genero_id: 1,
          distribuidora_id: 1,
          preco_centavos: 12000,
          promocao_centavos: null,
        }),
      }),
    );
  });
  it("não deixa salvar jogo sem cadastros relacionados", async () => {
    context.refs = {
      plataformas: [],
      generos: [],
      distribuidoras: [],
      criticos: [],
    };
    const user = userEvent.setup();
    mount(
      <Routes>
        <Route path="/admin/:tipo" element={<Admin />} />
      </Routes>,
      "/admin/jogos",
    );
    await screen.findByRole("button", { name: "Novo registro" });
    await user.click(screen.getByRole("button", { name: "Novo registro" }));
    expect(
      screen.getByText(/Antes de continuar, cadastre/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar registro" }),
    ).toBeDisabled();
  });
  it("mantém janela de exclusão aberta quando o banco bloqueia vínculo", async () => {
    api.mockImplementation(async (path, options) => {
      if (options?.method === "DELETE")
        throw Error("Registro vinculado a outros cadastros.");
      if (path === "/admin/plataformas") return [{ id: 1, nome: "PC" }];
      if (path === "/jogos") return [game];
      return [];
    });
    const user = userEvent.setup();
    mount(
      <Routes>
        <Route path="/admin/:tipo" element={<Admin />} />
      </Routes>,
      "/admin/plataformas",
    );
    await user.click(
      await screen.findByRole("button", { name: "Excluir registro 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Excluir registro", exact: true }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Registro vinculado",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("edita a observação privada e permite limpar o campo", async () => {
    api.mockImplementation(async (path) =>
      path === "/desejos"
        ? [{ id: 3, jogo_id: game.id, jogo: game, observacao: "Aguardar" }]
        : [],
    );
    const user = userEvent.setup();
    mount(<Wishes />);
    await user.click(
      await screen.findByRole("button", {
        name: "Editar observação de Jogo de teste",
      }),
    );
    await user.clear(screen.getByLabelText("Observação"));
    await user.click(
      screen.getByRole("button", { name: "Salvar", exact: true }),
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/desejos/3", {
        method: "PATCH",
        body: { observacao: "" },
      }),
    );
  });
  it("salva tema, plataforma favorita e disponibilidade", async () => {
    api.mockResolvedValue(context.user);
    const user = userEvent.setup();
    mount(<Account />);
    await user.click(screen.getByRole("button", { name: "Preferências" }));
    await user.selectOptions(screen.getByLabelText("Tema"), "escuro");
    await user.selectOptions(screen.getByLabelText("Plataforma favorita"), "1");
    await user.click(
      screen.getByLabelText(
        "Mostrar somente jogos em estoque ao abrir o catálogo",
      ),
    );
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/conta", {
        method: "PATCH",
        body: {
          preferencias: {
            tema: "escuro",
            plataforma_favorita: 1,
            somente_disponiveis: true,
          },
        },
      }),
    );
  });
  it("valida valores monetários sem perder centavos", () => {
    expect(centavos("120,00")).toBe(12000);
    expect(centavos("0.99")).toBe(99);
    expect(centavos("")).toBeNull();
    expect(() => centavos("1.234")).toThrow();
    expect(() => centavos("-1")).toThrow();
  });
  it("identifica preços e estoques de demonstração no catálogo", async () => {
    api.mockImplementation(async (path) =>
      path.startsWith("/jogos") ? [{ ...game, dados_demonstracao: true }] : [],
    );
    mount(<Catalog />);
    expect(
      await screen.findByText("Preço e estoque demonstrativos"),
    ).toBeInTheDocument();
    expect(screen.getByText("Base de demonstração.")).toBeInTheDocument();
  });
});
