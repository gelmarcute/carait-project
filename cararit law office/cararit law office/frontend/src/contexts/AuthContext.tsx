import {
  createContext,
  useContext,
  useState
} from "react";

const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({
  children
}: any) => {

  const [user, setUser] = useState(null);

  // ======================
  // API URL
  // ======================

  const API_URL = import.meta.env.VITE_API_URL;

  // ======================
  // LOGIN
  // ======================

  const login = async (
    emailOrUsername: string,
    password: string
  ) => {

    try {

      // ✅ Check kung may API URL
      if (!API_URL) {
        console.log("❌ VITE_API_URL is undefined! Check your .env file or Vercel environment variables.");
        return false;
      }

      console.log("📤 Sending to:", `${API_URL}/api/auth/login`);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: emailOrUsername,
            username: emailOrUsername,
            password,
          }),
        }
      );

      // ✅ Check kung nag-respond ang server
      if (!response.ok) {
        const errData = await response.json();
        console.log("❌ Server error:", errData.error);
        return false;
      }

      const data = await response.json();

      if (data.success) {

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setUser(data.user);

        console.log("✅ LOGIN SUCCESS");

        return true;
      }

      console.log("❌ Login failed:", data.error);

      return false;

    } catch (error: any) {

      console.log("❌ FETCH ERROR:", error.message);
      console.log("💡 Possible causes: Wrong API URL, server is down, or CORS issue");

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
    <AuthContext.Provider
      value={{
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};