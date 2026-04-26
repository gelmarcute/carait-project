import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

import { toast } from "sonner";



const Login = () => {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

 

  const { login } = useAuth();

  const navigate = useNavigate();



  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();

   

    if (!email || !password) {

      toast.error("Please enter both email and password.");

      return;

    }



    setIsLoading(true);



    try {

      const success = await login(email, password);



      if (success) {

        toast.success("Welcome! You are now logged in.");

        navigate("/dashboard");

      } else {

        toast.error("Invalid email or password. Please try again.");

      }

    } catch (error) {

      console.error("Login Error:", error);

      toast.error("An error occurred during login. Please try again later.");

    } finally {

      setIsLoading(false);

    }

  };



  const togglePasswordVisibility = () => {

    setShowPassword(!showPassword);

  };



  return (

    <div className="flex min-h-screen items-center justify-center bg-primary p-4">

      <Card className="w-full max-w-md shadow-2xl border-0">

        <CardHeader className="text-center pb-2 pt-8">

          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary">

            <Shield className="h-10 w-10 text-primary-foreground" />

          </div>

          <CardTitle className="text-2xl font-bold">Carait Management System</CardTitle>

          <p className="text-muted-foreground mt-1 text-base">Sign in to your account</p>

        </CardHeader>

        <CardContent className="px-8 pb-8">

          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-2">

              <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>

              <Input

                id="email"

                type="email"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                placeholder="your@email.com"

                className="h-14 text-lg"

                required

                disabled={isLoading}

              />

            </div>

           

            <div className="space-y-2">

              <Label htmlFor="password" className="text-base font-semibold">Password</Label>

              <div className="relative">

                <Input

                  id="password"

                  type={showPassword ? "text" : "password"}

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  placeholder="Enter password"

                  className="h-14 text-lg pr-14"

                  required

                  disabled={isLoading}

                />

                <Button

                  type="button"

                  variant="ghost"

                  size="icon"

                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"

                  onClick={togglePasswordVisibility}

                  disabled={isLoading}

                  aria-label={showPassword ? "Hide password" : "Show password"}

                >

                  {showPassword ? (

                    <EyeOff className="h-5 w-5 text-muted-foreground" />

                  ) : (

                    <Eye className="h-5 w-5 text-muted-foreground" />

                  )}

                </Button>

              </div>

            </div>

           

            <Button

              type="submit"

              className="w-full h-14 text-lg font-bold mt-6"

              disabled={isLoading}

            >

              {isLoading ? (

                <>

                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />

                  SIGNING IN...

                </>

              ) : (

                "SIGN IN"

              )}

            </Button>

          </form>

        </CardContent>

      </Card>

    </div>

  );

};



export default Login;