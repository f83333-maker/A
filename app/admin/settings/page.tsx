"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Save, Plus, Trash2, Loader2, Search, Tag, Link as LinkIcon, Truck, Settings, Type, Navigation } from "lucide-react"

interface FooterLink {
  name: string
  url: string
}

interface NavLink {
  name: string
  url: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"banner" | "nav" | "search" | "footer" | "basic">("banner")
  
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

  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("*")

      if (data) {
        data.forEach((item) => {
          try {
            const value = JSON.parse(item.value)
            if (item.key === "banner_title") setBannerTitle(value || "")
            else if (item.key === "banner_subtitle") setBannerSubtitle(value || "")
            else if (item.key === "nav_links") setNavLinks(value || [])
            else if (item.key === "search_placeholder") setSearchPlaceholder(value || "")
            else if (item.key === "hot_search_tags") setHotSearchTags(value || [])
            else if (item.key === "footer_links") setFooterLinks(value || [])
            else if (item.key === "delivery_text") setDeliveryText(value || "自动发货")
            else if (item.key === "site_name") setSiteName(value || "")
            else if (item.key === "site_description") setSiteDescription(value || "")
            else if (item.key === "contact_email") setContactEmail(value || "")
            else if (item.key === "contact_telegram") setContactTelegram(value || "")
            else if (item.key === "contact_qq") setContactQQ(value || "")
          } catch (e) {
            console.error("解析设置失败:", item.key, e)
          }
        })
      }
    } catch (error) {
      console.error("获取设置失败:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSetting(key: string, value: any) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        }, { onConflict: "key" })

      if (error) throw error
      alert("保存成功")
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败")
    } finally {
      setSaving(false)
    }
  }

  async function saveMultipleSettings(settings: { key: string; value: any }[]) {
    setSaving(true)
    try {
      for (const setting of settings) {
        await supabase
          .from("site_settings")
          .upsert({
            key: setting.key,
            value: JSON.stringify(setting.value),
            updated_at: new Date().toISOString()
          }, { onConflict: "key" })
      }
      alert("保存成功")
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败")
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
                <p className="text-[12px] text-[#6e6e73]">设置首页顶部的主标题和副标题</p>
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
    </div>
  )
}
