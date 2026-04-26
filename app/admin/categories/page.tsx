"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X, ArrowUp, ArrowDown } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
  description: string
  color: string
  sort_order: number
  is_active: boolean
  logo_url: string | null
  logo_data: string | null
  logo_bg_color: string | null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
    color: "#7CFF00",
    sort_order: 0,
    is_active: true,
    logo_url: "",
    logo_data: "",
    logo_bg_color: "#2d2e30",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingLogo, setIsFetchingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        icon: category.icon,
        description: category.description || "",
        color: category.color,
        sort_order: category.sort_order,
        is_active: category.is_active,
        logo_url: category.logo_url || "",
        logo_data: category.logo_data || "",
        logo_bg_color: category.logo_bg_color || "#2d2e30",
      })
      setLogoPreview(category.logo_data || null)
    } else {
      setEditingCategory(null)
      setFormData({
        name: "",
        icon: "",
        description: "",
        color: "#7CFF00",
        sort_order: categories.length,
        is_active: true,
        logo_url: "",
        logo_data: "",
        logo_bg_color: "#2d2e30",
      })
      setLogoPreview(null)
    }
    setIsModalOpen(true)
  }

  const handleFetchLogo = async () => {
    if (!formData.logo_url) return
    setIsFetchingLogo(true)
    try {
      const res = await fetch("/api/fetch-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.logo_url }),
      })
      const data = await res.json()
      if (data.logoBase64) {
        setFormData((prev) => ({
          ...prev,
          logo_data: data.logoBase64,
          logo_url: data.normalizedUrl || prev.logo_url,
        }))
        setLogoPreview(data.logoBase64)
      } else if (data.logoUrl) {
        setFormData((prev) => ({
          ...prev,
          logo_data: data.logoUrl,
          logo_url: data.normalizedUrl || prev.logo_url,
        }))
        setLogoPreview(data.logoUrl)
      }
    } catch (e) {
      console.error("获取Logo失败", e)
    } finally {
      setIsFetchingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories"
      const method = editingCategory ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setIsModalOpen(false)
        fetchCategories()
      }
    } catch (error) {
      console.error("Failed to save category:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个分类吗？")) return
    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      fetchCategories()
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
    const current = sorted[index]
    const prev = sorted[index - 1]
    try {
      await Promise.all([
        fetch(`/api/admin/categories/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...current, sort_order: prev.sort_order }),
        }),
        fetch(`/api/admin/categories/${prev.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...prev, sort_order: current.sort_order }),
        }),
      ])
      fetchCategories()
    } catch (error) {
      console.error("Failed to move category:", error)
    }
  }

  const handleMoveDown = async (index: number) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
    if (index === sorted.length - 1) return
    const current = sorted[index]
    const next = sorted[index + 1]
    try {
      await Promise.all([
        fetch(`/api/admin/categories/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...current, sort_order: next.sort_order }),
        }),
        fetch(`/api/admin/categories/${next.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...next, sort_order: current.sort_order }),
        }),
      ])
      fetchCategories()
    } catch (error) {
      console.error("Failed to move category:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    )
  }

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#e3e3e3]">分类管理</h1>
          <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
            管理产品分类，共 {categories.length} 个分类
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          添加分类
        </button>
      </div>

      {/* 分类列表 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3c3c3f]">
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">排序</th>
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">图标</th>
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">名称</th>
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6] hidden md:table-cell">描述</th>
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">状态</th>
              <th className="px-5 py-4 text-right text-[13px] font-semibold text-[#9aa0a6]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3c3c3f]">
            {sortedCategories.map((category, index) => (
              <tr key={category.id} className="hover:bg-[#2d2e30]/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortedCategories.length - 1}
                      className="p-1 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: category.logo_bg_color || "#2d2e30" }}
                  >
                    {category.logo_data ? (
                      <img src={category.logo_data} alt={category.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="text-[#6e6e73] text-[11px] font-medium">无</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[14px] font-medium text-[#e3e3e3]">{category.name}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <p className="text-[13px] text-[#6e6e73] font-medium truncate max-w-[200px]">
                    {category.description || "-"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 text-[12px] font-semibold rounded-full ${
                      category.is_active
                        ? "bg-[#81c995]/10 text-[#81c995]"
                        : "bg-[#6e6e73]/10 text-[#6e6e73]"
                    }`}
                  >
                    {category.is_active ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(category)}
                      className="p-2 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-[#9aa0a6] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[18px] font-semibold text-[#e3e3e3]">
                {editingCategory ? "编辑分类" : "添加分类"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 分类名称 */}
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">分类名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                  required
                />
              </div>

              {/* Logo 获取 */}
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">自动获取 Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="flex-1 h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                    placeholder="如：instagram.com 或 t.me"
                  />
                  <button
                    type="button"
                    onClick={handleFetchLogo}
                    disabled={isFetchingLogo || !formData.logo_url}
                    className="px-4 h-11 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[13px] disabled:bg-[#3c3c3f] disabled:text-[#6e6e73] disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                  >
                    {isFetchingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    获取Logo
                  </button>
                </div>

                {/* Logo 预览 */}
                {logoPreview && (
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border border-[#3c3c3f]"
                      style={{ backgroundColor: formData.logo_bg_color }}
                    >
                      <img src={logoPreview} alt="Logo预览" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[12px] font-medium text-[#9aa0a6] mb-1">背景色</label>
                      <input
                        type="color"
                        value={formData.logo_bg_color}
                        onChange={(e) => setFormData({ ...formData, logo_bg_color: e.target.value })}
                        className="w-10 h-8 rounded-lg border border-[#3c3c3f] cursor-pointer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null)
                        setFormData((prev) => ({ ...prev, logo_data: "", logo_url: "" }))
                      }}
                      className="text-[12px] text-[#ee675c] hover:underline"
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">描述</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">颜色</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-11 h-11 rounded-xl border border-[#3c3c3f] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">排序</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_active" className="text-[14px] font-medium text-[#e3e3e3]">
                  启用分类
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] font-semibold rounded-xl transition-all duration-200 text-[14px]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-11 bg-[#7CFF00] hover:bg-[#9FFF40] disabled:opacity-50 text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px] flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? "保存" : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
