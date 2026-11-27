// Definição do formulário administrativo deste cadastro.
export default {
  tipo: "avaliacoes",
  titulo: "Avaliações",
  campos: [
    ["jogo_id", "Jogo", "jogos"],
    ["critico_id", "Fonte da crítica", "criticos"],
    ["nota", "Nota (0 a 100)", "number"],
    ["url", "Link da avaliação original", "url"],
  ],
};
