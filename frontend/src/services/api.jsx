import axios from "axios";

export const api = axios.create({
    baseURL: "https://api.meuprojeto.com",
    headers: { "Content-Type": "application/json" },
});