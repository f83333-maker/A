"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // 获取保存的主题或系统偏好
    const savedTheme = localStorage.getItem("theme") as Theme | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    document.documentElement.setAttribute("data-theme", initialTheme)
    localStorage.setItem("theme", initialTheme)
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute("data-theme", theme)
      localStorage.setItem("theme", theme)
    }
  }, [theme, isMounted])

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  // SSR 兼容：防止客户端与服务器渲染不匹配
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // 如果在 Provider 外使用，返回默认值而不是抛错
    return {
      theme: "dark" as Theme,
      toggleTheme: () => {}
    }
  }
  return context
}
