import { Toaster } from "@/components/ui/toaster";

import { Toaster as Sonner } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";

import { ThemeProvider } from "@/components/theme-provider";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

import Schedules from "./pages/Schedules";

import Inventory from "./pages/Inventory";

import Solicitation from "./pages/Solicitation";

import Tasks from "./pages/Tasks";

import Logs from "./pages/Logs";

import UserManagement from "./pages/UserManagement";

import NotFound from "./pages/NotFound";



const queryClient = new QueryClient();



const App = () => (

  <QueryClientProvider client={queryClient}>

    {/* 👇 Added attribute="class" here so Tailwind knows when dark mode is on */}

    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">

      <TooltipProvider>

        <Toaster />

        <Sonner />

        <AuthProvider>

          <BrowserRouter>

            <Routes>

              <Route path="/" element={<Login />} />

              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/schedules" element={<Schedules />} />

              <Route path="/inventory" element={<Inventory />} />

              <Route path="/solicitation" element={<Solicitation />} />

              <Route path="/tasks" element={<Tasks />} />

              <Route path="/logs" element={<Logs />} />

              <Route path="/users" element={<UserManagement />} />

              <Route path="*" element={<NotFound />} />

            </Routes>

          </BrowserRouter>

        </AuthProvider>

      </TooltipProvider>

    </ThemeProvider>

  </QueryClientProvider>

);



export default App;