const { createInterface } = require("node:readline/promises");
const { abrirBanco } = require("../database");
const {
  CatalogoService,
  mensagemErro,
} = require("../services/catalogoService");

const formularios = {
  plataformas: [["nome", "Nome"]],
  generos: [["nome", "Nome"]],
  distribuidoras: [["nome", "Nome"]],
  criticos: [
    ["nome", "Nome do veículo/crítico"],
    ["site", "Site da fonte"],
  ],
  jogos: [
    ["titulo", "Título"],
    ["descricao", "Descrição"],
    ["plataforma_id", "ID plataforma", "n"],
    ["genero_id", "ID gênero", "n"],
    ["distribuidora_id", "ID distribuidora", "n"],
    ["preco_centavos", "Preço em centavos (19990 = R$199,90)", "n"],
    ["promocao_centavos", "Promoção em centavos (- remove)", "n?"],
  ],
  estoque: [
    ["jogo_id", "ID jogo", "n"],
    ["quantidade", "Quantidade disponível", "n"],
  ],
  avaliacoes: [
    ["jogo_id", "ID jogo", "n"],
    ["critico_id", "ID crítico", "n"],
    ["nota", "Nota de 0 a 100", "n"],
    ["url", "Link da avaliação original"],
  ],
  desejos: [
    ["jogo_id", "ID jogo", "n"],
    ["observacao", "Observação"],
  ],
};
async function iniciar() {
  const db = abrirBanco();
  await db.migrar();
  const s = new CatalogoService(db);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let sessao = null;
  async function ler(label) {
    return (await rl.question(label + ": ")).trim();
  }
  async function numero(label) {
    const v = await ler(label);
    return v === "" ? undefined : Number(v);
  }
  function mostrar(v) {
    if (Array.isArray(v)) {
      if (!v.length) console.log("Nenhum registro encontrado.");
      else console.table(v);
    } else console.log(JSON.stringify(v, null, 2));
  }
  async function formulario(tipo, atual = {}) {
    const d = {};
    for (const [campo, label, tipoCampo] of formularios[tipo]) {
      const v = await ler(
        label + (atual.id ? ` [${atual[campo] ?? "-"}; Enter mantém]` : ""),
      );
      if (atual.id && v === "") continue;
      d[campo] =
        tipoCampo === "n?" && (v === "-" || v === "")
          ? null
          : tipoCampo?.startsWith("n")
            ? v === ""
              ? NaN
              : Number(v)
            : v;
    }
    return d;
  }
  async function cadastroUsuario(inicial = false, admin = false) {
    const d = {
      nome: await ler("Nome"),
      email: await ler("Email"),
      senha: await ler("Senha (8–128 caracteres; visível neste terminal)"),
    };
    if (inicial) d.perfil = "admin";
    else if (admin)
      d.perfil =
        (await ler("Perfil (cliente/admin; Enter = cliente)")) || "cliente";
    mostrar(await s.cadastrar(d, sessao?.usuario.id, inicial));
  }
  async function gerenciar(tipo) {
    while (true) {
      console.log(
        `\n${tipo.toUpperCase()} — 1 Listar | 2 Criar | 3 Editar | 4 Excluir | 0 Voltar`,
      );
      const op = await ler("Opção");
      if (op === "0") return;
      try {
        const ator = sessao?.usuario.id;
        if (op === "1")
          mostrar(
            tipo === "desejos" ? await s.desejos(ator) : await s.listar(tipo),
          );
        else if (op === "2" || op === "3") {
          const id = op === "3" ? await numero("ID a editar") : undefined;
          if (op === "3" && !id) throw Error("ID inválido");
          const atual = id
            ? tipo === "desejos"
              ? (await s.desejos(ator)).find((d) => d.id === id)
              : (await s.listar(tipo)).find((d) => d.id === id)
            : {};
          if (!atual) {
            console.log("Registro não encontrado.");
            continue;
          }
          const dados = await formulario(tipo, atual);
          mostrar(
            tipo === "desejos"
              ? await s.salvarDesejo(ator, dados, id)
              : await s.salvar(ator, tipo, dados, id),
          );
        } else if (op === "4") {
          const id = await numero("ID a excluir");
          if ((await ler("Digite SIM para confirmar")) !== "SIM") continue;
          if (tipo === "desejos") await s.excluirDesejo(ator, id);
          else await s.excluir(ator, tipo, id);
          console.log("Registro excluído.");
        } else console.log("Opção inválida.");
      } catch (e) {
        console.log("Erro: " + mensagemErro(e));
      }
    }
  }
  try {
    console.log(
      "\nLAMBARI GAMES — Catálogo da loja física\nDados persistidos em SQLite. Não há compras ou reservas.",
    );
    while (true) {
      console.log(
        `\n${sessao ? "Conectado: " + sessao.usuario.nome : "Visitante"}\n1 Catálogo e filtros\n2 Detalhes, estoque e avaliações\n3 Cadastrar cliente\n4 Entrar\n5 Minha lista de desejos\n6 Minha conta e preferências\n7 Administração\n8 Sair da conta\n9 Criar administrador inicial\n0 Encerrar`,
      );
      const op = await ler("Opção");
      if (op === "0") break;
      try {
        if (sessao) sessao.usuario = await s.autenticarToken(sessao.token);
        const ator = sessao?.usuario.id;
        if (op === "1") {
          console.log("Filtros opcionais: Enter ignora. IDs:");
          for (const t of ["plataformas", "generos", "distribuidoras"]) {
            console.log(t);
            mostrar(await s.listar(t));
          }
          const f = { busca: await ler("Título contém") };
          for (const [campo, label] of [
            ["plataforma_id", "Plataforma"],
            ["genero_id", "Gênero"],
            ["distribuidora_id", "Distribuidora"],
          ])
            f[campo] = await numero("ID " + label);
          f.disponivel = (await ler("Somente em estoque? (s/n)")) === "s";
          f.promocao = (await ler("Somente promoções? (s/n)")) === "s";
          mostrar(await s.catalogo(f));
        } else if (op === "2")
          mostrar(await s.detalhe(await numero("ID do jogo")));
        else if (op === "3") await cadastroUsuario();
        else if (op === "4") {
          if (sessao) await s.logout(sessao.token);
          sessao = null;
          sessao = await s.login(
            await ler("Email"),
            await ler("Senha (visível neste terminal)"),
          );
          console.log("Login realizado.");
        } else if (op === "5") {
          await s.exigir(ator);
          await gerenciar("desejos");
        } else if (op === "6") {
          mostrar(await s.exigir(ator));
          console.log(
            "1 Alterar nome/email | 2 Alterar senha | 3 Preferências | 4 Excluir minha conta | 0 Voltar",
          );
          const acao = await ler("Opção");
          if (acao === "1") {
            const d = {},
              nome = await ler("Nome (Enter mantém)"),
              email = await ler("Email (Enter mantém)");
            if (nome) d.nome = nome;
            if (email) d.email = email;
            mostrar(await s.atualizarConta(ator, d));
          } else if (acao === "2") {
            await s.atualizarConta(ator, {
              senha_atual: await ler("Senha atual"),
              senha: await ler("Nova senha"),
            });
            sessao = null;
            console.log("Senha alterada. Entre novamente.");
          } else if (acao === "3") {
            const preferencias = {
              tema: (await ler("Tema (claro/escuro)")) || "claro",
              plataforma_favorita:
                (await numero("ID plataforma favorita (Enter remove)")) ?? null,
              somente_disponiveis:
                (await ler("Preferir jogos em estoque? (s/n)")) === "s",
            };
            mostrar(await s.atualizarConta(ator, { preferencias }));
          } else if (
            acao === "4" &&
            (await ler("Digite SIM para excluir a conta")) === "SIM"
          ) {
            await s.excluirUsuario(ator, ator);
            sessao = null;
            console.log("Conta excluída.");
          }
        } else if (op === "7") {
          await s.exigir(ator, true);
          const tipos = Object.keys(formularios).filter((t) => t !== "desejos");
          console.log(
            tipos.map((t, i) => `${i + 1} ${t}`).join("\n") +
              "\n8 Usuários\n0 Voltar",
          );
          const i = await numero("Cadastro");
          if (i >= 1 && i <= 7) await gerenciar(tipos[i - 1]);
          else if (i === 8) {
            mostrar(await s.listarUsuarios(ator));
            console.log(
              "1 Criar usuário | 2 Editar usuário | 3 Excluir usuário | 0 Voltar",
            );
            const a = await ler("Opção");
            if (a === "1") await cadastroUsuario(false, true);
            else if (a === "2") {
              const id = await numero("ID usuário");
              const d = {};
              for (const campo of ["nome", "email", "perfil"]) {
                const v = await ler(campo + " (Enter mantém)");
                if (v) d[campo] = v;
              }
              mostrar(await s.atualizarUsuario(ator, id, d));
            } else if (a === "3") {
              const id = await numero("ID usuário");
              if ((await ler("Digite SIM para excluir")) === "SIM")
                await s.excluirUsuario(ator, id);
            }
          }
        } else if (op === "8") {
          if (sessao) await s.logout(sessao.token);
          sessao = null;
          console.log("Sessão encerrada.");
        } else if (op === "9") await cadastroUsuario(true);
        else console.log("Opção inválida.");
      } catch (e) {
        if (e.status === 401) sessao = null;
        console.log("Erro: " + mensagemErro(e));
      }
    }
  } finally {
    rl.close();
    await db.close();
  }
}
if (require.main === module)
  iniciar().catch((e) => {
    if (e.code !== "ABORT_ERR" && e.code !== "ERR_USE_AFTER_CLOSE")
      console.error(mensagemErro(e));
    process.exitCode = 1;
  });
module.exports = { iniciar };
