import { api } from "./api";

export async function autenticar(email, senha) {
    const resposta = await api.post("/login", { email, senha });
    return resposta.data; // { token, usuario }
}

    // dentro de views/Login.js:

async function handleSubmit(e) {
    e.preventDefault();

    try {
        const { token } = await autenticar(email, senha);
        localStorage.setItem("token", token);
        login();
        navigate("/home");
    } catch {
        setErro("Email ou senha inválidos");
    }
}