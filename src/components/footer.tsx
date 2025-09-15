
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from "next-themes";

export function Footer() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <footer className="w-full py-4 mt-auto space-y-4">
        <div className="flex items-center justify-center space-x-2">
            <Sun className="h-5 w-5"/>
            <Switch
                id="theme-mode"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
            />
            <Moon className="h-5 w-5"/>
        </div>
      <div className="container mx-auto text-center text-xs text-white/60 space-y-1">
        <p>Build Teste 0.0.1 Version</p>
        <p>RyannBreston desenvolvedor</p>
        <p>© {new Date().getFullYear()} Acelera GT. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};
