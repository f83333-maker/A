"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "登录失败")
        setIsLoading(false)
        return
      }

      // 使用 localStorage 存储登录状态（v0预览环境cookie不可靠）
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
            请登录您的管理员账号
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

            {/* 邮箱输入 */}
            <div>
              <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-12 pl-11 pr-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  required
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
                  placeholder="请输入密码"
                  className="w-full h-12 pl-11 pr-12 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  required
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
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 pt-6 border-t border-[#3c3c3f]">
            <p className="text-[12px] text-[#6e6e73] text-center font-medium">
              默认账号: admin@admin.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
