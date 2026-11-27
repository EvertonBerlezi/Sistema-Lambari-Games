const { randomBytes } = require("node:crypto");
const { Op } = require("sequelize");
const { Erro, inteiro, plain, ocultar } = require("./validacao");
const { hashToken, conferir } = require("./seguranca");
const cadastros = require("../cadastros");
const nomes = {
  usuarios: "Usuário",
  plataformas: "Plataforma",
  generos: "Gênero",
  distribuidoras: "Distribuidora",
  criticos: "Fonte",
  jogos: "Jogo",
  estoque: "Estoque",
  avaliacoes: "Avaliação",
  desejos: "Desejo",
};
class CatalogoService {
  constructor(db) {
    this.db = db;
    this.m = db.models;
  }
  opts(extra = {}) {
    return { ...this.db.options(), ...extra };
  }
  transacao(fn) {
    return this.db.transacao(fn);
  }
  async travaAdmin() {
    await this.db.sequelize.query(
      "SELECT pg_advisory_xact_lock(88216002)",
      this.opts(),
    );
  }
  tabela(t) {
    if (
      ![
        "plataformas",
        "generos",
        "distribuidoras",
        "criticos",
        "jogos",
        "estoque",
        "avaliacoes",
      ].includes(t)
    )
      throw new Erro("Cadastro inválido.");
    return t;
  }
  async existe(t, id) {
    if (!nomes[t]) throw new Erro("Cadastro inválido.");
    const r = await this.m[t].findByPk(inteiro(id, "ID"), this.opts());
    if (!r) throw new Erro(`${nomes[t]} com ID ${id} não encontrado(a).`, 404);
    return plain(r);
  }
  async exigir(id, admin = false) {
    if (!id) throw new Erro("Faça login para continuar.", 401);
    const u = await this.usuario(id);
    if (admin && u.perfil !== "admin")
      throw new Erro("Acesso exclusivo do administrador.", 403);
    return u;
  }
  async login(login, senha) {
    const u = await this.m.usuarios.findOne(
      this.opts({
        where: {
          email: String(login || "")
            .trim()
            .toLowerCase(),
        },
      }),
    );
    if (!u || !conferir(senha, u.senha))
      throw new Erro("Email ou senha inválidos.", 401);
    const token = randomBytes(32).toString("hex");
    await this.transacao(async () => {
      await this.m.sessoes.destroy(
        this.opts({ where: { expira: { [Op.lt]: Date.now() } } }),
      );
      await this.m.sessoes.create(
        {
          token: hashToken(token),
          usuario_id: u.id,
          expira: Date.now() + 86400000,
        },
        this.opts(),
      );
    });
    return { autenticado: true, token, usuario: ocultar(u) };
  }
  async autenticarToken(token) {
    if (typeof token !== "string" || !token)
      throw new Erro("Sessão inválida.", 401);
    const sessao = await this.m.sessoes.findOne(
      this.opts({
        where: { token: hashToken(token), expira: { [Op.gt]: Date.now() } },
      }),
    );
    if (!sessao) throw new Erro("Sessão expirada ou inválida.", 401);
    return this.usuario(sessao.usuario_id);
  }
  async logout(token) {
    await this.m.sessoes.destroy(
      this.opts({ where: { token: hashToken(token) } }),
    );
  }
  async listar(t) {
    this.tabela(t);
    return (await this.m[t].findAll(this.opts({ order: [["id", "ASC"]] }))).map(
      plain,
    );
  }
  async salvar(ator, t, d, id) {
    await this.exigir(ator, true);
    this.tabela(t);
    return this.transacao(async () => {
      const antigo = id === undefined ? {} : await this.existe(t, id);
      const campos = await cadastros[t].validar({ ...antigo, ...d }, this);
      if (id === undefined)
        return plain(await this.m[t].create(campos, this.opts()));
      await this.m[t].update(campos, this.opts({ where: { id } }));
      return this.existe(t, id);
    });
  }
  async excluir(ator, t, id) {
    await this.exigir(ator, true);
    this.tabela(t);
    await this.existe(t, id);
    await this.m[t].destroy(this.opts({ where: { id } }));
  }
  includes() {
    return [
      { model: this.m.plataformas, as: "plataforma" },
      { model: this.m.generos, as: "genero" },
      { model: this.m.distribuidoras, as: "distribuidora" },
      { model: this.m.estoque, as: "estoque" },
      {
        model: this.m.avaliacoes,
        as: "avaliacoes",
        include: [{ model: this.m.criticos, as: "critico" }],
      },
    ];
  }
  jogoPublico(row) {
    const j = plain(row);
    const notas = j.avaliacoes || [];
    return {
      ...j,
      plataforma: j.plataforma?.nome,
      genero: j.genero?.nome,
      distribuidora: j.distribuidora?.nome,
      quantidade: j.estoque?.quantidade ?? 0,
      preco_atual_centavos: j.promocao_centavos ?? j.preco_centavos,
      nota_media: notas.length
        ? Math.round(notas.reduce((n, a) => n + a.nota, 0) / notas.length)
        : null,
      avaliacoes: notas.map((a) => ({
        ...a,
        critico: a.critico?.nome,
        site: a.critico?.site,
      })),
    };
  }
  async catalogo(f = {}) {
    const where = {};
    for (const c of ["plataforma_id", "genero_id", "distribuidora_id"])
      if (f[c] !== undefined)
        where[c] = Array.isArray(f[c])
          ? { [Op.in]: f[c].map((v) => inteiro(v, c)) }
          : inteiro(f[c], c);
    if (f.busca)
      where.titulo = {
        [Op.iLike]: "%" + String(f.busca).replace(/[\\%_]/g, "\\$&") + "%",
      };
    if (f.promocao) where.promocao_centavos = { [Op.ne]: null };
    const includes = this.includes();
    if (f.disponivel) {
      includes[3].required = true;
      includes[3].where = { quantidade: { [Op.gt]: 0 } };
    }
    return (
      await this.m.jogos.findAll(
        this.opts({ where, include: includes, order: [["titulo", "ASC"]] }),
      )
    ).map((r) => this.jogoPublico(r));
  }
  async detalhe(id) {
    inteiro(id, "Jogo");
    const j = await this.m.jogos.findByPk(
      id,
      this.opts({ include: this.includes() }),
    );
    if (!j) throw new Erro("Jogo não encontrado.", 404);
    return this.jogoPublico(j);
  }
}
Object.assign(
  CatalogoService.prototype,
  cadastros.usuarios.metodos,
  cadastros.desejos.metodos,
);
function mensagemErro(e) {
  if (e.name === "SequelizeUniqueConstraintError")
    return "Já existe um registro com esses dados.";
  if (e.name === "SequelizeForeignKeyConstraintError")
    return "Registro vinculado a outros cadastros. Remova ou altere os vínculos primeiro.";
  if (e instanceof Erro) return e.message;
  if (e.name === "SequelizeValidationError")
    return "Dados inválidos. Confira os campos informados.";
  return "Não foi possível concluir a operação.";
}
module.exports = { CatalogoService, Erro, mensagemErro };
