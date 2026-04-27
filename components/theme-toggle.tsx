"use client"

import { useTheme } from "./theme-provider"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] transition-all duration-200"
      aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]" />
      )}
    </button>
  )
}
