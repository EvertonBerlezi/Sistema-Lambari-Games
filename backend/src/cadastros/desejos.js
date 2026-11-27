const {
  Erro,
  texto,
  inteiro,
  validarUrl,
  email,
  plain,
  ocultar,
} = require("../services/validacao");
module.exports = {
  campos(D) {
    return {
      usuario_id: { type: D.INTEGER, allowNull: false },
      jogo_id: { type: D.INTEGER, allowNull: false },
      observacao: { type: D.TEXT, defaultValue: "" },
    };
  },
  metodos: {
    async desejos(ator) {
      await this.exigir(ator);
      const rows = await this.m.desejos.findAll(
        this.opts({
          where: { usuario_id: ator },
          include: [
            { model: this.m.jogos, as: "jogo", include: this.includes() },
          ],
          order: [["id", "DESC"]],
        }),
      );
      return rows.map((r) => ({ ...plain(r), jogo: this.jogoPublico(r.jogo) }));
    },
    async salvarDesejo(ator, d, id) {
      await this.exigir(ator);
      return this.transacao(async () => {
        if (id !== undefined) {
          const a = await this.existe("desejos", id);
          if (a.usuario_id !== ator)
            throw new Erro("Este desejo pertence a outro usuário.", 403);
          d = { ...a, ...d };
        }
        const campos = {
          usuario_id: ator,
          jogo_id: inteiro(d.jogo_id, "Jogo"),
          observacao: d.observacao == null ? "" : String(d.observacao).trim(),
        };
        if (campos.observacao.length > 2000)
          throw new Erro("Observação deve ter até 2000 caracteres.");
        await this.existe("jogos", campos.jogo_id);
        if (id === undefined)
          return plain(await this.m.desejos.create(campos, this.opts()));
        await this.m.desejos.update(campos, this.opts({ where: { id } }));
        return this.existe("desejos", id);
      });
    },
    async excluirDesejo(ator, id) {
      await this.exigir(ator);
      const d = await this.existe("desejos", id);
      if (d.usuario_id !== ator)
        throw new Erro("Este desejo pertence a outro usuário.", 403);
      await this.m.desejos.destroy(this.opts({ where: { id } }));
    },
  },
};
