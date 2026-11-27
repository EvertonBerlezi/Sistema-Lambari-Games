import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import { Loading, Empty } from "./components/UI";
import Catalog from "./pages/Catalog";
import Auth from "./pages/Auth";
import Wishes from "./pages/Wishes";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import "./App.css";
function Guard({ admin = false, children }) {
  const { user, ready } = useApp(),
    location = useLocation();
  if (!ready) return <Loading />;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.perfil !== "admin") return <Navigate to="/" replace />;
  return children;
}
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Catalog />} />
            <Route path="/login" element={<Auth key="login" />} />
            <Route
              path="/cadastro"
              element={<Auth key="cadastro" register />}
            />
            <Route
              path="/desejos"
              element={
                <Guard>
                  <Wishes />
                </Guard>
              }
            />
            <Route
              path="/conta"
              element={
                <Guard>
                  <Account />
                </Guard>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/admin/jogos" replace />}
            />
            <Route
              path="/admin/:tipo"
              element={
                <Guard admin>
                  <Admin />
                </Guard>
              }
            />
            <Route
              path="*"
              element={
                <Empty
                  title="Página não encontrada"
                  text="Use o menu para voltar ao catálogo."
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
