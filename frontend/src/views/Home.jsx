import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <div>
            <h1>Bem-vindo!</h1>
            <button onClick={handleLogout}>Sair</button>
        </div>
    );
}