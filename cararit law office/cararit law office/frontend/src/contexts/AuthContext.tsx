import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://carait-project-production.up.railway.app";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (emailOrUsername, password) => {
    try {
      // ✅ FIXED: Gumagamit na ng Railway backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: emailOrUsername,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return true;
      } else {
        console.error("Login failed:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Server connection error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};