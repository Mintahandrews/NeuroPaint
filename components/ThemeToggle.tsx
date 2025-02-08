"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { theme, setTheme } = useTheme();

  const handleThemeChange = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await setTheme(theme === "dark" ? "light" : "dark");
    } catch (error) {
      toast.error("Failed to change theme. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [theme, setTheme]);

  return (
    <div className="flex items-center space-x-2">
      <Sun
        size={20}
        className="text-gray-700 dark:text-gray-400 transition-colors"
      />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={handleThemeChange}
        disabled={isLoading}
        className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-gray-300 disabled:opacity-50"
      />
      <Moon
        size={20}
        className="text-gray-500 dark:text-gray-200 transition-colors"
      />
    </div>
  );
}
