import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🌟 Kukunin nito ang link sa .env file. Kapag wala, Railway link ang gagamitin niya as backup.
  const API_URL = "http://localhost:3000";

  const login = async (emailOrUsername, password) => {
    try {
      // 🌟 Ginagamit na niya ngayon ang API_URL variable
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailOrUsername, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true; 
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData.error);
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