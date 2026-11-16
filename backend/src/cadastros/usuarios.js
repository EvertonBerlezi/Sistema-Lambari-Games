const {
  Erro,
  texto,
  inteiro,
  validarUrl,
  email,
  plain,
  ocultar,
} = require("../services/validacao");
const { hashSenha, conferir } = require("../services/seguranca");
module.exports = {
  campos(D) {
    return {
      nome: { type: D.STRING(255), allowNull: false },
      email: { type: D.STRING(255), allowNull: false },
      senha: { type: D.STRING(255), allowNull: false },
      perfil: { type: D.STRING(20), defaultValue: "cliente" },
      preferencias: { type: D.JSONB, defaultValue: {} },
    };
  },
  metodos: {
    async usuario(id) {
      return ocultar(await this.existe("usuarios", id));
    },
    async temAdmin() {
      return (
        (await this.m.usuarios.count(
          this.opts({ where: { perfil: "admin" } }),
        )) > 0
      );
    },
    async cadastrar(d, ator, inicial = false) {
      const campos = {
        nome: texto(d.nome, "Nome"),
        email: email(d.email),
        senha: hashSenha(d.senha),
        perfil: d.perfil || "cliente",
      };
      if (!["cliente", "admin"].includes(campos.perfil))
        throw new Erro("Perfil inválido.");
      return this.transacao(async () => {
        await this.travaAdmin();
        if (inicial) {
          if (await this.temAdmin())
            throw new Erro("O administrador inicial já foi criado.", 403);
          if (campos.perfil !== "admin")
            throw new Erro("O primeiro administrador deve ter perfil admin.");
        } else if (campos.perfil === "admin") await this.exigir(ator, true);
        return ocultar(await this.m.usuarios.create(campos, this.opts()));
      });
    },
    async atualizarConta(ator, d) {
      await this.exigir(ator);
      return this.transacao(async () => {
        const atual = await this.m.usuarios.findByPk(
          ator,
          this.opts({ lock: true }),
        );
        const campos = {};
        if (d.nome !== undefined) campos.nome = texto(d.nome, "Nome");
        if (d.email !== undefined) campos.email = email(d.email);
        if (d.preferencias !== undefined) {
          const p = d.preferencias;
          if (
            !p ||
            typeof p !== "object" ||
            Array.isArray(p) ||
            Object.keys(p).some(
              (k) =>
                ![
                  "tema",
                  "plataforma_favorita",
                  "somente_disponiveis",
                ].includes(k),
            )
          )
            throw new Erro("Preferências inválidas.");
          if (p.tema !== undefined && !["claro", "escuro"].includes(p.tema))
            throw new Erro("Tema inválido.");
          if (
            p.somente_disponiveis !== undefined &&
            typeof p.somente_disponiveis !== "boolean"
          )
            throw new Erro("Disponibilidade deve ser booleana.");
          if (p.plataforma_favorita != null)
            await this.existe("plataformas", p.plataforma_favorita);
          campos.preferencias = { ...atual.preferencias, ...p };
        }
        if (d.senha !== undefined) {
          if (!conferir(d.senha_atual, atual.senha))
            throw new Erro("Senha atual incorreta.", 403);
          campos.senha = hashSenha(d.senha);
        }
        await atual.update(campos, this.opts());
        if (campos.senha)
          await this.m.sessoes.destroy(
            this.opts({ where: { usuario_id: ator } }),
          );
        return ocultar(atual);
      });
    },
    async atualizarUsuario(ator, id, d) {
      return this.transacao(async () => {
        await this.travaAdmin();
        await this.exigir(ator, true);
        const u = await this.existe("usuarios", id);
        const perfil = d.perfil ?? u.perfil;
        if (!["cliente", "admin"].includes(perfil))
          throw new Erro("Perfil inválido.");
        if (
          u.perfil === "admin" &&
          perfil !== "admin" &&
          (await this.m.usuarios.count(
            this.opts({ where: { perfil: "admin" } }),
          )) === 1
        )
          throw new Erro("Não é possível remover o último administrador.");
        await this.m.usuarios.update(
          {
            nome: texto(d.nome ?? u.nome, "Nome"),
            email: email(d.email ?? u.email),
            perfil,
          },
          this.opts({ where: { id } }),
        );
        return this.usuario(id);
      });
    },
    async excluirUsuario(ator, id) {
      return this.transacao(async () => {
        await this.travaAdmin();
        await this.exigir(ator);
        if (ator !== id) await this.exigir(ator, true);
        const u = await this.existe("usuarios", id);
        if (
          u.perfil === "admin" &&
          (await this.m.usuarios.count(
            this.opts({ where: { perfil: "admin" } }),
          )) === 1
        )
          throw new Erro("Não é possível excluir o último administrador.");
        await this.m.usuarios.destroy(this.opts({ where: { id } }));
      });
    },
    async listarUsuarios(ator) {
      await this.exigir(ator, true);
      return (
        await this.m.usuarios.findAll(this.opts({ order: [["nome", "ASC"]] }))
      ).map(ocultar);
    },
  },
};
