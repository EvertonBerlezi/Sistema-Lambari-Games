// Definição do formulário administrativo deste cadastro.
export default {
  tipo: "jogos",
  titulo: "Jogos",
  campos: [
    ["titulo", "Título", "text"],
    ["descricao", "Descrição", "textarea", true],
    ["capa_url", "URL da capa", "text", true],
    ["plataforma_id", "Plataforma", "plataformas"],
    ["genero_id", "Gênero", "generos"],
    ["distribuidora_id", "Distribuidora", "distribuidoras"],
    ["preco_centavos", "Preço normal (R$)", "money"],
    ["promocao_centavos", "Preço promocional (R$)", "money", true],
    [
      "dados_demonstracao",
      "Preços e estoque de demonstração",
      "checkbox",
      true,
    ],
  ],
};
