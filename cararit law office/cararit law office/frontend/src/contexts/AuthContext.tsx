import { createContext, useContext, useState } from "react";

const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ======================
  // API URL (BALIK LOCALHOST)
  // ======================
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ======================
  // LOGIN
  // ======================
  const login = async (email: string, password: string) => {
    try {
      if (!API_URL) {
        console.log("❌ API URL is undefined!");
        return false;
      }

      console.log("📤 Sending to:", `${API_URL}/api/auth/login`);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify({
          email: email, 
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.log("❌ Server error:", errData.error);
        return false;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        console.log("✅ LOGIN SUCCESS");
        return true;
      }

      console.log("❌ Login failed:", data.error);
      return false;
    } catch (error: any) {
      console.log("❌ FETCH ERROR:", error.message);
      console.log("💡 Check if backend is running on http://localhost:8080");
      return false;
    }
  };

  // ======================
  // LOGOUT
  // ======================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};