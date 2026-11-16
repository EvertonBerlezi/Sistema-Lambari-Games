const { abrirBanco } = require("../database");
const { CatalogoService } = require("./catalogoService");
const service = new CatalogoService(abrirBanco());
module.exports = service;
