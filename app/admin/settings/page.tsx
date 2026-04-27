"use client"

import { useState, useEffect } from "react"
import { Save, Plus, Trash2, Loader2, Search, Tag, Link as LinkIcon, Truck, Settings, Type, Navigation, CreditCard, X, ToggleLeft, ToggleRight, Pencil, Check } from "lucide-react"

interface FooterLink {
  name: string
  url: string
}

interface NavLink {
  name: string
  url: string
}

interface PaymentConfig {
  id: string
  name: string
  type: string
  api_url: string
  merchant_id: string
  merchant_key: string
  extra_config: Record<string, unknown>
  supported_methods: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"banner" | "nav" | "search" | "footer" | "basic" | "payment">("banner")
  
  // Banner设置
  const [bannerTitle, setBannerTitle] = useState("")
  const [bannerSubtitle, setBannerSubtitle] = useState("")
  
  // 导航设置
  const [navLinks, setNavLinks] = useState<NavLink[]>([])
  
  // 基本设置
  const [siteName, setSiteName] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactTelegram, setContactTelegram] = useState("")
  const [contactQQ, setContactQQ] = useState("")
  
  // 搜索设置
  const [searchPlaceholder, setSearchPlaceholder] = useState("")
  const [hotSearchTags, setHotSearchTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [deliveryText, setDeliveryText] = useState("")
  
  // 底部链接设置
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  
  // 支付设置（旧版，保留兼容）
  const [epayApiUrl, setEpayApiUrl] = useState("")
  const [epayPid, setEpayPid] = useState("")
  const [epayKey, setEpayKey] = useState("")

  // 新版支付配置
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([])
  const [paymentConfigsLoading, setPaymentConfigsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentConfig | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    name: "",
    type: "epay",
    api_url: "",
    merchant_id: "",
    merchant_key: "",
    supported_methods: ["wxpay", "alipay"] as string[],
    is_active: true,
  })
  const [paymentSaving, setPaymentSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchPaymentConfigs()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings")
      const result = await res.json()
      
      if (!res.ok) {
        console.error("加载设置错误:", result.error)
        return
      }

      const data = result.data
      if (data) {
        data.forEach((item: { key: string; value: string }) => {
          // 兼容：有些值是裸字符串，有些是 JSON 字符串
          let value: unknown = item.value
          try {
            value = JSON.parse(item.value)
          } catch {
            // 解析失败则直接使用原始字符串
            value = item.value
          }
          if (item.key === "banner_title") setBannerTitle((value as string) || "")
          else if (item.key === "banner_subtitle") setBannerSubtitle((value as string) || "")
          else if (item.key === "nav_links") setNavLinks(Array.isArray(value) ? value : [])
          else if (item.key === "search_placeholder") setSearchPlaceholder((value as string) || "")
          else if (item.key === "hot_search_tags") setHotSearchTags(Array.isArray(value) ? value : [])
          else if (item.key === "footer_links") setFooterLinks(Array.isArray(value) ? value : [])
          else if (item.key === "delivery_text") setDeliveryText((value as string) || "自动发货")
          else if (item.key === "site_name") setSiteName((value as string) || "")
          else if (item.key === "site_description") setSiteDescription((value as string) || "")
          else if (item.key === "contact_email") setContactEmail((value as string) || "")
          else if (item.key === "contact_telegram") setContactTelegram((value as string) || "")
          else if (item.key === "contact_qq") setContactQQ((value as string) || "")
          else if (item.key === "epay_api_url") setEpayApiUrl((value as string) || "")
          else if (item.key === "epay_pid") setEpayPid((value as string) || "")
          else if (item.key === "epay_key") setEpayKey((value as string) || "")
        })
      }
    } catch (error) {
      console.error("获取设置失败:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSetting(key: string, value: any) {
    await saveMultipleSettings([{ key, value }])
  }

  // 获取支付配置列表
  async function fetchPaymentConfigs() {
    setPaymentConfigsLoading(true)
    try {
      const res = await fetch("/api/admin/payment-configs")
      const data = await res.json()
      if (Array.isArray(data)) {
        setPaymentConfigs(data)
      }
    } catch (error) {
      console.error("获取支付配置失败:", error)
    } finally {
      setPaymentConfigsLoading(false)
    }
  }

  // 解析配置字段值（清除转义字符）
  function parseConfigValue(value: string | null): string {
    if (!value) return ""
    let str = String(value)
    // 清除双重转义
    try {
      // 如果值本身是 JSON 字符串，先解析一次
      if (str.startsWith('"') && str.endsWith('"')) {
        str = JSON.parse(str)
      }
    } catch {
      // 忽略解析错误，继续使用原始值
    }
    // 清除转义字符
    return str.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\//g, "/").trim()
  }

  // 打开添加/编辑支付配置弹窗
  function openPaymentModal(config?: PaymentConfig) {
    if (config) {
      setEditingPayment(config)
      setPaymentForm({
        name: config.name || "",
        type: config.type || "epay",
        api_url: parseConfigValue(config.api_url),
        merchant_id: parseConfigValue(config.merchant_id),
        merchant_key: parseConfigValue(config.merchant_key),
        supported_methods: config.supported_methods || ["wxpay", "alipay"],
        is_active: config.is_active,
      })
    } else {
      setEditingPayment(null)
      setPaymentForm({
        name: "",
        type: "epay",
        api_url: "",
        merchant_id: "",
        merchant_key: "",
        supported_methods: ["wxpay", "alipay"],
        is_active: true,
      })
    }
    setShowPaymentModal(true)
  }

  // 保存支付配置
  async function savePaymentConfig() {
    if (!paymentForm.name.trim()) {
      alert("请填写配置名称")
      return
    }
    setPaymentSaving(true)
    try {
      const url = editingPayment
        ? `/api/admin/payment-configs/${editingPayment.id}`
        : "/api/admin/payment-configs"
      const method = editingPayment ? "PUT" : "POST"
      
      // 清理值中的转义字符后再保存
      const cleanedForm = {
        ...paymentForm,
        api_url: parseConfigValue(paymentForm.api_url),
        merchant_id: parseConfigValue(paymentForm.merchant_id),
        merchant_key: parseConfigValue(paymentForm.merchant_key),
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedForm),
      })
      
      if (!res.ok) throw new Error("保存失败")
      
      await fetchPaymentConfigs()
      setShowPaymentModal(false)
    } catch (error) {
      console.error("保存支付配置失败:", error)
      alert("保存失败")
    } finally {
      setPaymentSaving(false)
    }
  }

  // 切换支付配置启用状态
  async function togglePaymentActive(config: PaymentConfig) {
    try {
      await fetch(`/api/admin/payment-configs/${config.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !config.is_active }),
      })
      setPaymentConfigs(prev =>
        prev.map(c => c.id === config.id ? { ...c, is_active: !c.is_active } : c)
      )
    } catch (error) {
      console.error("切换状态失败:", error)
    }
  }

  // 删除支付配置
  async function deletePaymentConfig(id: string) {
    if (!confirm("确定要删除此支付配置吗？")) return
    try {
      await fetch(`/api/admin/payment-configs/${id}`, { method: "DELETE" })
      setPaymentConfigs(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error("删除失败:", error)
    }
  }

  // 切换支付方式
  function togglePaymentMethod(method: string) {
    setPaymentForm(prev => ({
      ...prev,
      supported_methods: prev.supported_methods.includes(method)
        ? prev.supported_methods.filter(m => m !== method)
        : [...prev.supported_methods, method],
    }))
  }

  async function saveMultipleSettings(settings: { key: string; value: any }[]) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || "保存失败")
      }
      
      alert("保存成功")
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败: " + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function addTag() {
    if (newTag.trim() && !hotSearchTags.includes(newTag.trim())) {
      setHotSearchTags([...hotSearchTags, newTag.trim()])
      setNewTag("")
    }
  }

  function removeTag(index: number) {
    setHotSearchTags(hotSearchTags.filter((_, i) => i !== index))
  }

  function addFooterLink() {
    setFooterLinks([...footerLinks, { name: "", url: "" }])
  }

  function updateFooterLink(index: number, field: "name" | "url", value: string) {
    const newLinks = [...footerLinks]
    newLinks[index][field] = value
    setFooterLinks(newLinks)
  }

  function removeFooterLink(index: number) {
    setFooterLinks(footerLinks.filter((_, i) => i !== index))
  }

  function addNavLink() {
    setNavLinks([...navLinks, { name: "", url: "" }])
  }

  function updateNavLink(index: number, field: "name" | "url", value: string) {
    const newLinks = [...navLinks]
    newLinks[index][field] = value
    setNavLinks(newLinks)
  }

  function removeNavLink(index: number) {
    setNavLinks(navLinks.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#7CFF00] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-[22px] font-bold text-[#e3e3e3] mb-6">网站设置</h1>
      
      {/* 选项卡 */}
      <div className="flex gap-1 mb-6 bg-[#1e1f20] p-1 rounded-xl border border-[#3c3c3f] overflow-x-auto">
        {[
          { id: "banner", label: "Banner设置", icon: Type },
          { id: "nav", label: "顶部导航", icon: Navigation },
          { id: "search", label: "搜索与标签", icon: Search },
          { id: "footer", label: "底部导航", icon: LinkIcon },
          { id: "basic", label: "基本设置", icon: Settings },
          { id: "payment", label: "支付设置", icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#7CFF00] text-[#131314]"
                : "text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#2d2e30]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner设置 */}
      {activeTab === "banner" && (
        <div className="space-y-6">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7CFF00]/10 flex items-center justify-center">
                <Type className="w-5 h-5 text-[#7CFF00]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">首页Banner标题</h2>
                <p className="text-[12px] text-[#6e6e73]">设置首页顶部��主标题和副标题</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">主标题</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                  placeholder="如：账号 批发平台"
                />
                <p className="text-[11px] text-[#6e6e73] mt-1">提示：可用空格分隔，第二部分会显示为蓝色</p>
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">副标题</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                  placeholder="如：专业、安全、便捷的一站式账号服务平台"
                />
              </div>
            </div>

            <button
              onClick={() => saveMultipleSettings([
                { key: "banner_title", value: bannerTitle },
                { key: "banner_subtitle", value: bannerSubtitle },
              ])}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </button>
          </div>
        </div>
      )}

      {/* 顶部导航设置 */}
      {activeTab === "nav" && (
        <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#81c995]/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-[#81c995]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">顶部导航链接</h2>
                <p className="text-[12px] text-[#6e6e73]">网站顶部显示的导航菜单</p>
              </div>
            </div>
            <button
              onClick={addNavLink}
              className="px-3 py-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] rounded-lg text-[13px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              添加链接
            </button>
          </div>

          <div className="space-y-3">
            {navLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => updateNavLink(index, "name", e.target.value)}
                  className="w-32 h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                  placeholder="链接名称"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateNavLink(index, "url", e.target.value)}
                  className="flex-1 h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                  placeholder="链接地址，如 / 或 /order-query"
                />
                <button onClick={() => removeNavLink(index)} className="p-2 text-[#6e6e73] hover:text-[#ee675c]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {navLinks.length === 0 && (
              <p className="text-[13px] text-[#6e6e73] text-center py-4">暂无链接，点击上方按钮添加</p>
            )}
          </div>

          <button
            onClick={() => saveSetting("nav_links", navLinks)}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      )}

      {/* 搜索与标签设置 */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* 搜索框文字 */}
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7CFF00]/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-[#7CFF00]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">搜索框默认文字</h2>
                <p className="text-[12px] text-[#6e6e73]">用户未输入时显示的提示文字</p>
              </div>
            </div>
            <input
              type="text"
              value={searchPlaceholder}
              onChange={(e) => setSearchPlaceholder(e.target.value)}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
              placeholder="如：搜索你想要的商品..."
            />
            <button
              onClick={() => saveSetting("search_placeholder", searchPlaceholder)}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </button>
          </div>

          {/* 热门搜索标签 */}
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fdd663]/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-[#fdd663]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">热门搜索标签</h2>
                <p className="text-[12px] text-[#6e6e73]">搜索框下方显示的快捷标签</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {hotSearchTags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2e30] rounded-full text-[13px] text-[#e3e3e3]"
                >
                  {tag}
                  <button onClick={() => removeTag(index)} className="text-[#6e6e73] hover:text-[#ee675c]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                className="flex-1 h-10 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                placeholder="输入标签���称，按回车添加"
              />
              <button onClick={addTag} className="px-4 h-10 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] rounded-lg text-[13px] flex items-center gap-2">
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
            
            <button
              onClick={() => saveSetting("hot_search_tags", hotSearchTags)}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </button>
          </div>

          {/* 发货方式文字 */}
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#81c995]/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#81c995]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">发货方式文字</h2>
                <p className="text-[12px] text-[#6e6e73]">商品卡片和购买弹窗显示的发货方式</p>
              </div>
            </div>
            <input
              type="text"
              value={deliveryText}
              onChange={(e) => setDeliveryText(e.target.value)}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
              placeholder="如：自动发货"
            />
            <button
              onClick={() => saveSetting("delivery_text", deliveryText)}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </button>
          </div>
        </div>
      )}

      {/* 底部导航设置 */}
      {activeTab === "footer" && (
        <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c58af9]/10 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-[#c58af9]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">底部导航链接</h2>
                <p className="text-[12px] text-[#6e6e73]">页面底部显示的导航链接</p>
              </div>
            </div>
            <button
              onClick={addFooterLink}
              className="px-3 py-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] rounded-lg text-[13px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              添加链接
            </button>
          </div>

          <div className="space-y-3">
            {footerLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => updateFooterLink(index, "name", e.target.value)}
                  className="w-32 h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                  placeholder="链接名称"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                  className="flex-1 h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                  placeholder="链接地址，如 /about"
                />
                <button onClick={() => removeFooterLink(index)} className="p-2 text-[#6e6e73] hover:text-[#ee675c]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {footerLinks.length === 0 && (
              <p className="text-[13px] text-[#6e6e73] text-center py-4">暂无链接，点击上方按钮添加</p>
            )}
          </div>

          <button
            onClick={() => saveSetting("footer_links", footerLinks)}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      )}

      {/* 基本设置 */}
      {activeTab === "basic" && (
        <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">网站名称</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
              placeholder="如：账号批发平台"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">网站描述</label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00] resize-none"
              placeholder="网站简短描述..."
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">联系邮箱</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
              placeholder="support@example.com"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">Telegram 联系方式</label>
            <input
              type="text"
              value={contactTelegram}
              onChange={(e) => setContactTelegram(e.target.value)}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
              placeholder="https://t.me/username 或 @username"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">QQ 联系方式</label>
            <input
              type="text"
              value={contactQQ}
              onChange={(e) => setContactQQ(e.target.value)}
              className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
              placeholder="QQ号 或 QQ群链接"
            />
          </div>

          <button
            onClick={() => saveMultipleSettings([
              { key: "site_name", value: siteName },
              { key: "site_description", value: siteDescription },
              { key: "contact_email", value: contactEmail },
              { key: "contact_telegram", value: contactTelegram },
              { key: "contact_qq", value: contactQQ },
            ])}
            disabled={saving}
            className="px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存设置
          </button>
        </div>
      )}

      {/* 支付设置 */}
      {activeTab === "payment" && (
        <div className="space-y-6">
          {/* 头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7CFF00]/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#7CFF00]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">支付系统管理</h2>
                <p className="text-[12px] text-[#6e6e73]">配置多个支付渠道，支持易支付等接口</p>
              </div>
            </div>
            <button
              onClick={() => openPaymentModal()}
              className="px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加支付配置
            </button>

          </div>

          {/* 支付配置仪表盘 */}
          {paymentConfigsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
            </div>
          ) : paymentConfigs.length === 0 ? (
            <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-12 text-center">
              <CreditCard className="w-12 h-12 text-[#3c3c3f] mx-auto mb-4" />
              <p className="text-[14px] text-[#6e6e73] mb-4">暂无支��配置</p>
              <button
                onClick={() => openPaymentModal()}
                className="px-4 py-2 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] rounded-lg text-[13px] inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加第一个支付配置
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentConfigs.map(config => (
                <div
                  key={config.id}
                  className={`bg-[#1e1f20] rounded-2xl border p-5 transition-all cursor-pointer hover:border-[#7CFF00]/50 ${
                    config.is_active ? "border-[#3c3c3f]" : "border-[#3c3c3f]/50 opacity-60"
                  }`}
                  onClick={() => openPaymentModal(config)}
                >
                  {/* 卡片头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        config.type === "epay" ? "bg-[#7CFF00]/10" : "bg-[#1677ff]/10"
                      }`}>
                        <CreditCard className={`w-5 h-5 ${
                          config.type === "epay" ? "text-[#7CFF00]" : "text-[#1677ff]"
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-[#e3e3e3]">{config.name}</h3>
                        <p className="text-[11px] text-[#6e6e73]">{config.type === "epay" ? "易支付" : config.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePaymentActive(config) }}
                      className="p-1"
                    >
                      {config.is_active ? (
                        <ToggleRight className="w-6 h-6 text-[#7CFF00]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#6e6e73]" />
                      )}
                    </button>
                  </div>

                  {/* 支持的支付方式 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {config.supported_methods?.map(method => (
                      <span
                        key={method}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                          method === "wxpay"
                            ? "bg-[#07c160]/10 text-[#07c160]"
                            : "bg-[#1677ff]/10 text-[#1677ff]"
                        }`}
                      >
                        {method === "wxpay" ? "微信支付" : method === "alipay" ? "支付宝" : method}
                      </span>
                    ))}
                  </div>

                  {/* 配置信息 */}
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6e6e73]">商户ID</span>
                      <span className="text-[#9aa0a6] font-mono">{config.merchant_id || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6e6e73]">API地址</span>
                      <span className="text-[#9aa0a6] truncate max-w-[150px]" title={config.api_url}>
                        {config.api_url ? (() => {
                          try {
                            return new URL(config.api_url).hostname
                          } catch {
                            return config.api_url.substring(0, 20) + (config.api_url.length > 20 ? "..." : "")
                          }
                        })() : "-"}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#3c3c3f]/50">
                    <button
                      onClick={(e) => { e.stopPropagation(); openPaymentModal(config) }}
                      className="flex-1 py-2 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePaymentConfig(config.id) }}
                      className="py-2 px-3 bg-[#ee675c]/10 hover:bg-[#ee675c]/20 text-[#ee675c] rounded-lg text-[12px] font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 回调地址提示 */}
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-5">
            <h3 className="text-[14px] font-medium text-[#e3e3e3] mb-3">支付回调地址</h3>
            <div className="bg-[#2d2e30] rounded-xl p-4">
              <p className="text-[12px] text-[#6e6e73] mb-2">请在各支付平台后台设置以下异步通知地址：</p>
              <code className="text-[13px] text-[#7CFF00] break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/epay` : "/api/webhooks/epay"}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* 支付配置弹窗 */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-lg bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] shadow-2xl">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-5 border-b border-[#3c3c3f]">
              <h3 className="text-[16px] font-semibold text-[#e3e3e3]">
                {editingPayment ? "编辑支付配置" : "添加支付配置"}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 text-[#6e6e73] hover:text-[#e3e3e3] hover:bg-[#2d2e30] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">配置名称 *</label>
                <input
                  type="text"
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                  placeholder="如：易支付-主站、支付宝直连"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">支付类型</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                >
                  <option value="epay">易支付</option>
                  <option value="alipay_direct">支付宝直连</option>
                  <option value="wxpay_native">微信原生支付</option>
                  <option value="usdt">USDT</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">API 接口地址</label>
                <input
                  type="text"
                  value={paymentForm.api_url}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, api_url: e.target.value }))}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                  placeholder="如：https://pay.example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">商户ID (PID)</label>
                  <input
                    type="text"
                    value={paymentForm.merchant_id}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, merchant_id: e.target.value }))}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                    placeholder="1001"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">商户密钥 (Key)</label>
                  <input
                    type="password"
                    value={paymentForm.merchant_key}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, merchant_key: e.target.value }))}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] focus:outline-none focus:border-[#7CFF00]"
                    placeholder="商户密钥"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">支持的支付方式</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "wxpay", name: "微信支付", color: "#07c160" },
                    { id: "alipay", name: "支付宝", color: "#1677ff" },
                    { id: "qqpay", name: "QQ钱包", color: "#12b7f5" },
                    { id: "bank", name: "银行卡", color: "#fdd663" },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      className={`px-3 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${
                        paymentForm.supported_methods.includes(method.id)
                          ? "border-current bg-current/10"
                          : "border-[#3c3c3f] bg-[#2d2e30] text-[#6e6e73]"
                      }`}
                      style={{
                        color: paymentForm.supported_methods.includes(method.id) ? method.color : undefined,
                        borderColor: paymentForm.supported_methods.includes(method.id) ? method.color : undefined,
                      }}
                    >
                      {paymentForm.supported_methods.includes(method.id) && (
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                      )}
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[13px] font-medium text-[#9aa0a6]">启用此配置</span>
                <button
                  type="button"
                  onClick={() => setPaymentForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className="p-1"
                >
                  {paymentForm.is_active ? (
                    <ToggleRight className="w-8 h-8 text-[#7CFF00]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#6e6e73]" />
                  )}
                </button>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#3c3c3f]">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] rounded-lg text-[13px] font-medium"
              >
                取消
              </button>
              <button
                onClick={savePaymentConfig}
                disabled={paymentSaving}
                className="px-4 py-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[13px] flex items-center gap-2 disabled:opacity-50"
              >
                {paymentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
