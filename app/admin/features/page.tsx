"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"

interface Feature {
  id: string
  icon: string
  title: string
  description: string
  color: string
  sort_order: number
  is_active: boolean
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Feature | null>(null)
  const [formData, setFormData] = useState({
    icon: "",
    title: "",
    description: "",
    color: "#7CFF00",
    sort_order: 0,
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/features")
      const data = await res.json()
      setFeatures(data)
    } catch (error) {
      console.error("Failed to fetch:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (item?: Feature) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        icon: item.icon,
        title: item.title,
        description: item.description || "",
        color: item.color,
        sort_order: item.sort_order,
        is_active: item.is_active,
      })
    } else {
      setEditingItem(null)
      setFormData({
        icon: "",
        title: "",
        description: "",
        color: "#7CFF00",
        sort_order: features.length,
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingItem 
        ? `/api/admin/features/${editingItem.id}`
        : "/api/admin/features"
      const method = editingItem ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个特性吗？")) return

    try {
      await fetch(`/api/admin/features/${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#e3e3e3]">特性管理</h1>
          <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
            管理平台特性展示，共 {features.length} 个特性
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          添加特性
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((item) => (
          <div
            key={item.id}
            className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-5 hover:border-[#5f6368] transition-all"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${item.color}15` }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#e3e3e3]">{item.title}</h3>
                    <p className="text-[13px] text-[#6e6e73] font-medium mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-[#9aa0a6] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                    item.is_active 
                      ? "bg-[#81c995]/10 text-[#81c995]" 
                      : "bg-[#6e6e73]/10 text-[#6e6e73]"
                  }`}>
                    {item.is_active ? "显示" : "隐藏"}
                  </span>
                  <span className="text-[11px] text-[#6e6e73] font-medium">
                    排序: {item.sort_order}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[18px] font-semibold text-[#e3e3e3]">
                {editingItem ? "编辑特性" : "添加特性"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    特性名称
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    图标 (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                    placeholder="如: ️"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    颜色
                  </label>
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
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    排序
                  </label>
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
                  显示特性
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
                  {editingItem ? "保存" : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
