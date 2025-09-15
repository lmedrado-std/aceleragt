
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from 'lucide-react';
import { Button } from "./ui/button";

export function Footer() {
  const { theme, setTheme } = useTheme();

  return (
     <footer className="w-full max-w-4xl mx-auto py-4 px-4 md:px-0">
      <div className="flex justify-between items-center border-t pt-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Acelera GT. Todos os direitos reservados.</p>
        <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </footer>
  );
};
