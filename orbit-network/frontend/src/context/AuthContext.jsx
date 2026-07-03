import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";
import { connectSocket, disconnectSocket } from "../socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("orbit_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/users/me")
      .then((res) => {
        setUser(res.data);
        connectSocket();
      })
      .catch(() => localStorage.removeItem("orbit_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("orbit_token", token);
    setUser(userData);
    connectSocket();
  };

  const logout = () => {
    localStorage.removeItem("orbit_token");
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
