import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost" // Pinalitan ng ghost para pumantay sa ibang header buttons
      size="icon"
      // Parehas na parehas ng styling sa Back button at Notification bell
      className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-white text-primary shadow-sm hover:bg-white/90 border-none transition-colors shrink-0"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 md:h-6 md:w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 md:h-6 md:w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}