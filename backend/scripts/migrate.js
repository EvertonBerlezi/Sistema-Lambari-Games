const { abrirBanco } = require("../src/database");
const db = abrirBanco();
db.migrar()
  .then(() => console.log("Migrações PostgreSQL concluídas."))
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
