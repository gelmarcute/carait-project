import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";

import {
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";

import { toast } from "sonner";

// ============================
// API URL
// ============================

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL,

  withCredentials: true
});

const Login = () => {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  // ============================
  // LOGIN
  // ============================

  const handleLogin = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!email || !password) {

      toast.error(
        "Please enter email and password."
      );

      return;
    }

    setIsLoading(true);

    try {

      const res = await API.post(
        "/api/auth/login",
        {
          email,
          password
        }
      );

      console.log(
        "LOGIN RESPONSE:",
        res.data
      );

      // ============================
      // SAVE TOKEN
      // ============================

      if (res.data.token) {

        localStorage.setItem(
          "token",
          res.data.token
        );
      }

      // ============================
      // SAVE USER
      // ============================

      if (res.data.user) {

        localStorage.setItem(
          "user",
          JSON.stringify(
            res.data.user
          )
        );
      }

      toast.success(
        "Login successful!"
      );

      // ============================
      // REDIRECT
      // ============================

      navigate("/dashboard");

    } catch (err: any) {

      console.error(
        "LOGIN ERROR:",
        err.response?.data ||
        err.message
      );

      toast.error(
        err.response?.data?.error ||
        "Login failed"
      );

    } finally {

      setIsLoading(false);
    }
  };

  // ============================
  // TOGGLE PASSWORD
  // ============================

  const togglePasswordVisibility =
    () => {

      setShowPassword(
        !showPassword
      );
    };

  return (

    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">

      {/* BACKGROUND EFFECTS */}

      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full blur-3xl opacity-30"></div>

      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl opacity-30"></div>

      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl opacity-30"></div>

      {/* CARD */}

      <Card className="z-10 w-full max-w-md border border-border/50 bg-background/70 backdrop-blur-xl shadow-2xl rounded-2xl">

        <CardHeader className="space-y-2 text-center pb-6 pt-10">

          {/* LOGO */}

          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center">

            <img
              src="/logo.png"
              alt="Logo"
              className="h-full w-full object-contain"
            />

          </div>

          <CardTitle className="text-3xl font-extrabold">

            Carait Management

          </CardTitle>

          <CardDescription>

            Securely sign in to your workspace

          </CardDescription>

        </CardHeader>

        <CardContent className="px-8 pb-10">

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >

            {/* EMAIL */}

            <div className="space-y-2">

              <Label htmlFor="email">

                Email Address

              </Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="name@example.com"
                className="h-12"
                required
                disabled={isLoading}
              />

            </div>

            {/* PASSWORD */}

            <div className="space-y-2">

              <Label htmlFor="password">

                Password

              </Label>

              <div className="relative">

                <Input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
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
                  onClick={
                    togglePasswordVisibility
                  }
                >

                  {showPassword ? (

                    <EyeOff className="h-5 w-5" />

                  ) : (

                    <Eye className="h-5 w-5" />

                  )}

                </Button>

              </div>

            </div>

            {/* LOGIN BUTTON */}

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