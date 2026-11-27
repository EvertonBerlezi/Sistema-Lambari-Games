const { createInterface } = require("node:readline/promises");
const { abrirBanco } = require("../src/database");
const {
  CatalogoService,
  mensagemErro,
} = require("../src/services/catalogoService");
(async () => {
  const db = abrirBanco(),
    rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    await db.migrar();
    const s = new CatalogoService(db);
    if (await s.temAdmin())
      throw Error(
        "Já existe administrador. Use Administração > Usuários para criar outro.",
      );
    const nome = await rl.question("Nome: "),
      email = await rl.question("Email: "),
      senha = await rl.question(
        "Senha (mínimo 8 caracteres; visível no terminal): ",
      );
    const u = await s.cadastrar(
      { nome, email, senha, perfil: "admin" },
      null,
      true,
    );
    console.log("Administrador criado:", u.email);
  } finally {
    rl.close();
    await db.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
