const app = require("./app");
const { PORT } = require("./configs");

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});