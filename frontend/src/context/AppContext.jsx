import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, session } from "../lib/api";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(null);
  const [refs, setRefs] = useState({
      plataformas: [],
      generos: [],
      distribuidoras: [],
      criticos: [],
    }),
    [refsError, setRefsError] = useState("");
  const notify = useCallback(
    (message, kind = "success") => setNotice({ message, kind, id: Date.now() }),
    [],
  );
  const refreshRefs = useCallback(async () => {
    try {
      const names = ["plataformas", "generos", "distribuidoras", "criticos"];
      const result = await Promise.all(names.map((n) => api("/" + n)));
      setRefs(Object.fromEntries(names.map((n, i) => [n, result[i]])));
      setRefsError("");
    } catch (e) {
      setRefsError(e.message);
    }
  }, []);
  useEffect(() => {
    refreshRefs();
  }, [refreshRefs]);
  useEffect(() => {
    let live = true;
    if (!session.get()) {
      setReady(true);
      return;
    }
    api("/conta")
      .then((u) => {
        if (live) setUser(u);
      })
      .catch((e) => {
        if (e.status === 401) session.set(null);
        else notify(e.message, "error");
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [notify]);
  useEffect(() => {
    const expire = () => {
      session.set(null);
      setUser(null);
    };
    window.addEventListener("lambari:expired", expire);
    return () => window.removeEventListener("lambari:expired", expire);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme =
      user?.preferencias?.tema || "claro";
  }, [user]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function login(email, senha) {
    const r = await api("/login", { method: "POST", body: { email, senha } });
    session.set(r.token);
    setUser(r.usuario);
  }
  async function logout() {
    try {
      if (session.get()) await api("/logout", { method: "POST" });
    } catch (e) {
      notify(e.message, "error");
    } finally {
      session.set(null);
      setUser(null);
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        ready,
        refs,
        refsError,
        refreshRefs,
        notify,
        login,
        logout,
      }}
    >
      {children}
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={"toast " + notice.kind}
        >
          <span>{notice.message}</span>
          <button aria-label="Fechar mensagem" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
