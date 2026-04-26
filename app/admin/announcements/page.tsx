"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  is_new: boolean
  is_active: boolean
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_new: true,
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/announcements")
      const data = await res.json()
      setAnnouncements(data)
    } catch (error) {
      console.error("Failed to fetch:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (item?: Announcement) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        content: item.content || "",
        is_new: item.is_new,
        is_active: item.is_active,
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: "",
        content: "",
        is_new: true,
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
        ? `/api/admin/announcements/${editingItem.id}`
        : "/api/admin/announcements"
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
    if (!confirm("确定要删除这条公告吗？")) return

    try {
      await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" })
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
          <h1 className="text-[24px] font-semibold text-[#e3e3e3]">公告管理</h1>
          <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
            管理平台公告，共 {announcements.length} 条公告
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          添加公告
        </button>
      </div>

      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3c3c3f]">
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">标题</th>
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6] hidden md:table-cell">内容</th>
              <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">状态</th>
              <th className="px-5 py-4 text-right text-[13px] font-semibold text-[#9aa0a6]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3c3c3f]">
            {announcements.map((item) => (
              <tr key={item.id} className="hover:bg-[#2d2e30]/50 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-[14px] font-medium text-[#e3e3e3]">{item.title}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <p className="text-[13px] text-[#6e6e73] font-medium truncate max-w-[300px]">
                    {item.content || "-"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.is_new && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#ee675c]/10 text-[#ee675c]">
                        New
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      item.is_active 
                        ? "bg-[#81c995]/10 text-[#81c995]" 
                        : "bg-[#6e6e73]/10 text-[#6e6e73]"
                    }`}>
                      {item.is_active ? "显示" : "隐藏"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[18px] font-semibold text-[#e3e3e3]">
                {editingItem ? "编辑公告" : "添加公告"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  公告标题
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
                  公告内容
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors resize-none"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#e3e3e3]">标记为新公告</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#e3e3e3]">显示公告</span>
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
