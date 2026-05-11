import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ============================
// API URL (BALIK LOCALHOST)
// ============================
const API_URL = "http://localhost:3000";

// ============================
// AXIOS INSTANCE
// ============================
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

const Login = () => {
  const navigate = useNavigate(); // Pwede mo itong i-keep in case kailanganin sa iba
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ============================
  // LOGIN FUNCTION
  // ============================
  const handleLogin = async (e: any) => {
    e.preventDefault();

    if (!loginId || !password) {
      toast.error("Please enter credentials");
      return;
    }

    setIsLoading(true);

    try {
      console.log("📤 SENDING LOGIN REQUEST TO LOCALHOST...");

      // ============================
      // LOGIN REQUEST
      // ============================
      const res = await api.post("/api/auth/login", {
        email: loginId,
        password: password,
      });

      console.log("✅ LOGIN RESPONSE:", res.data);

      if (!res.data.success) {
        toast.error(res.data.error || "Login failed");
        return;
      }

      // I-save ang credentials sa browser
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      toast.success("Login successful!");
      
      // ============================
      // THE FIX: FORCE REFRESH TO SYNC CONTEXT
      // ============================
      // Bibigyan natin ng 1 second ang user para makita yung "Login successful" 
      // tapos ire-refresh natin ang page papuntang dashboard para mabasa ng AuthContext!
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);

    } catch (err: any) {
      console.error("❌ FULL LOGIN ERROR:", err);

      if (err.code === "ECONNABORTED") {
        toast.error("Server timeout. Backend may be offline.");
      } else if (err.response) {
        console.log("❌ SERVER RESPONSE:", err.response.data);
        toast.error(err.response.data?.error || err.response.data?.message || "Server error");
      } else if (err.request) {
        console.log("❌ NO SERVER RESPONSE");
        toast.error("Cannot connect to backend server. Is localhost:3000 running?");
      } else {
        console.log("❌ UNKNOWN ERROR:", err.message);
        toast.error(err.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl opacity-30"></div>

      {/* CARD */}
      <Card className="z-10 w-full max-w-md border border-border/50 bg-background/70 backdrop-blur-xl shadow-2xl rounded-2xl">
        <CardHeader className="space-y-2 text-center pb-6 pt-10">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-3xl font-extrabold">
            Carait Management
          </CardTitle>
          <CardDescription>
            Sign in to continue (Local Mode)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* LOGIN ID */}
            <div className="space-y-2">
              <Label htmlFor="loginId">Email</Label>
              <Input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter email"
                className="h-12"
                required
                disabled={isLoading}
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pr-12"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;