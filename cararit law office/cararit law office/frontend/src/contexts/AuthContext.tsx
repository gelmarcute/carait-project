import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (emailOrUsername, password) => {
    try {
      // 🌟 BINAGO: Nakaturo na ito sa LOCAL Backend mo (Port 3000)
      const response = await fetch("https://carait-project-production.up.railway.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailOrUsername, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true; // Success
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData.error);
        return false; // Failed
      }
    } catch (error) {
      console.error("Server connection error:", error);
      return false; // Failed
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