"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, User, Loader2, Clock } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [beijingTime, setBeijingTime] = useState("")

  // 实时显示北京时间
  useEffect(() => {
    const updateBeijingTime = () => {
      const now = new Date()
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
      const beijingDate = new Date(utcTime + (8 * 3600000))
      
      const year = beijingDate.getFullYear()
      const month = String(beijingDate.getMonth() + 1).padStart(2, '0')
      const day = String(beijingDate.getDate()).padStart(2, '0')
      const hour = String(beijingDate.getHours()).padStart(2, '0')
      const minute = String(beijingDate.getMinutes()).padStart(2, '0')
      const second = String(beijingDate.getSeconds()).padStart(2, '0')
      
      setBeijingTime(`${year}-${month}-${day} ${hour}:${minute}:${second}`)
    }
    
    updateBeijingTime()
    const interval = setInterval(updateBeijingTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "登录失败")
        setIsLoading(false)
        return
      }

      // 使用 localStorage 存储登录状态
      localStorage.setItem("admin_session", JSON.stringify(data.admin))
      
      // 跳转到后台
      window.location.href = "/admin"
    } catch {
      setError("网络错误，请稍后重试")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#131314] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8ab4f8]/10 mb-4">
            <Lock className="w-8 h-8 text-[#8ab4f8]" />
          </div>
          <h1 className="text-[28px] font-semibold text-[#e3e3e3] mb-2">
            后台管理系统
          </h1>
          <p className="text-[14px] text-[#9aa0a6] font-medium">
            请使用动态时间密码登录
          </p>
        </div>

        {/* 北京时间显示 */}
        <div className="bg-[#2d2e30] rounded-xl border border-[#3c3c3f] p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-[#8ab4f8]" />
            <span className="text-[13px] text-[#9aa0a6]">北京时间</span>
          </div>
          <p className="text-center text-[24px] font-mono font-bold text-[#e3e3e3] mt-2">
            {beijingTime || "--:--:--"}
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-[#ee675c]/10 border border-[#ee675c]/30 rounded-xl">
                <p className="text-[13px] text-[#ee675c] font-medium">{error}</p>
              </div>
            )}

            {/* 用户名输入 */}
            <div>
              <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="年月日 (如20260424)"
                  className="w-full h-12 pl-11 pr-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors font-mono"
                  required
                  maxLength={8}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="年月日时分 (如202604241845)"
                  className="w-full h-12 pl-11 pr-12 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors font-mono"
                  required
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6e6e73] hover:text-[#e3e3e3] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:opacity-50 disabled:cursor-not-allowed text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  验证中...
                </>
              ) : (
                "登录"
              )}
            </button>
          </form>

          {/* 安全提示 */}
          <div className="mt-6 pt-6 border-t border-[#3c3c3f]">
            <p className="text-[11px] text-[#6e6e73] text-center font-medium">
              动态时间密码系统 - 每分钟自动更新
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
