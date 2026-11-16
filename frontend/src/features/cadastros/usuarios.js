// Definição do formulário administrativo deste cadastro.
export default {
  tipo: "usuarios",
  titulo: "Usuários",
  campos: [
    ["nome", "Nome", "text"],
    ["email", "Email", "email"],
    ["senha", "Senha inicial", "password"],
    ["perfil", "Perfil", "perfil"],
  ],
};
