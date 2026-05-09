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

      const data = await response.json();

      if (response.ok && data.success) {

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setUser(data.user);

        return true;
      }

      console.log(data.error);

      return false;

    } catch (error) {

      console.log("❌ SERVER ERROR");
      console.log(error);

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