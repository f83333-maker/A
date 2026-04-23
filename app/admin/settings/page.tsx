"use client"

import { useState, useEffect } from "react"
import { Loader2, Save } from "lucide-react"

interface Settings {
  site_name: string
  site_description: string
  contact_email: string
  contact_telegram: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "",
    site_description: "",
    contact_email: "",
    contact_telegram: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      const data = await res.json()
      
      const settingsObj: Settings = {
        site_name: "",
        site_description: "",
        contact_email: "",
        contact_telegram: "",
      }
      
      data.forEach((item: { key: string; value: string }) => {
        if (item.key in settingsObj) {
          settingsObj[item.key as keyof Settings] = JSON.parse(item.value || '""')
        }
      })
      
      setSettings(settingsObj)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setMessage("设置已保存")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      setMessage("保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#e3e3e3]">网站设置</h1>
        <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
          配置网站基本信息
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
              网站名称
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
              placeholder="如：账号批发平台"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
              网站描述
            </label>
            <textarea
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors resize-none"
              placeholder="网站简短描述..."
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
              联系邮箱
            </label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
              placeholder="support@example.com"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
              Telegram 联系方式
            </label>
            <input
              type="text"
              value={settings.contact_telegram}
              onChange={(e) => setSettings({ ...settings, contact_telegram: e.target.value })}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
              placeholder="@username"
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:opacity-50 text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px]"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存设置
            </button>
            {message && (
              <span className={`text-[14px] font-medium ${
                message.includes("失败") ? "text-[#ee675c]" : "text-[#81c995]"
              }`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
