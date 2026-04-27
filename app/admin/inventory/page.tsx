"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Package, CheckCircle, Clock, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface InventoryItem {
  id: string
  product_id: string
  content: string
  status: string
  order_id: string | null
  sold_at: string | null
  created_at: string
}

interface InventoryStats {
  available: number
  sold: number
  total: number
}

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("productId")
  const productName = searchParams.get("name") || "商品"

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({ available: 0, sold: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<"all" | "available" | "sold">("all")

  const fetchInventory = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/inventory?productId=${productId}`)
      const data = await res.json()
      if (data.inventory) {
        setInventory(data.inventory)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("获取库存失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [productId])

  const handleAddInventory = async () => {
    if (!newContent.trim() || !productId) return
    setAdding(true)
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, content: newContent })
      })
      const data = await res.json()
      if (data.success) {
        setNewContent("")
        setShowAddForm(false)
        fetchInventory()
      } else {
        alert(data.error || "添加失败")
      }
    } catch (error) {
      alert("添加失败")
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条库存吗？")) return
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}&productId=${productId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        fetchInventory()
      } else {
        alert(data.error || "删除失败")
      }
    } catch (error) {
      alert("删除失败")
    }
  }

  const filteredInventory = inventory.filter(item => {
    if (filter === "all") return true
    return item.status === filter
  })

  if (!productId) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-[#5f6368] mb-4" />
          <h2 className="text-xl font-semibold text-[#e3e3e3] mb-2">请选择商品</h2>
          <p className="text-[#9aa0a6] mb-4">从产品管理页面进入库存管理</p>
          <Link href="/admin/products" className="text-[#7CFF00] hover:underline">
            前往产品管理
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-[#2d2e30] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#9aa0a6]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#e3e3e3]">库存管理</h1>
            <p className="text-[#9aa0a6] text-sm">{productName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7CFF00] text-[#131314] rounded-lg font-medium hover:bg-[#9FFF40] transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加库存
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1e1f20] border border-[#3c3c3f] rounded-xl p-4">
          <div className="text-[#9aa0a6] text-sm mb-1">总库存</div>
          <div className="text-2xl font-bold text-[#e3e3e3]">{stats.total}</div>
        </div>
        <div className="bg-[#1e1f20] border border-[#3c3c3f] rounded-xl p-4">
          <div className="text-[#81c995] text-sm mb-1">可用</div>
          <div className="text-2xl font-bold text-[#81c995]">{stats.available}</div>
        </div>
        <div className="bg-[#1e1f20] border border-[#3c3c3f] rounded-xl p-4">
          <div className="text-[#f28b82] text-sm mb-1">已售出</div>
          <div className="text-2xl font-bold text-[#f28b82]">{stats.sold}</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "全部" },
          { key: "available", label: "可用" },
          { key: "sold", label: "已售出" }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item.key
                ? "bg-[#7CFF00] text-[#131314]"
                : "bg-[#2d2e30] text-[#9aa0a6] hover:bg-[#3c3c3f]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 库存列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="text-center py-20 bg-[#1e1f20] border border-[#3c3c3f] rounded-xl">
          <Package className="w-12 h-12 mx-auto text-[#5f6368] mb-3" />
          <p className="text-[#9aa0a6]">暂无库存</p>
        </div>
      ) : (
        <div className="bg-[#1e1f20] border border-[#3c3c3f] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3c3c3f]">
                <th className="text-left px-4 py-3 text-[#9aa0a6] text-sm font-medium">内容</th>
                <th className="text-left px-4 py-3 text-[#9aa0a6] text-sm font-medium w-24">状态</th>
                <th className="text-left px-4 py-3 text-[#9aa0a6] text-sm font-medium w-40">创建时间</th>
                <th className="text-right px-4 py-3 text-[#9aa0a6] text-sm font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id} className="border-b border-[#3c3c3f]/50 hover:bg-[#2d2e30]/50">
                  <td className="px-4 py-3">
                    <code className="text-[13px] text-[#e3e3e3] bg-[#2d2e30] px-2 py-1 rounded font-mono">
                      {item.content}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {item.status === "available" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#81c995]/20 text-[#81c995] text-xs rounded-full">
                        <Clock className="w-3 h-3" />
                        可用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f28b82]/20 text-[#f28b82] text-xs rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        已售
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#9aa0a6] text-sm">
                    {new Date(item.created_at).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.status === "available" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-[#f28b82] hover:bg-[#f28b82]/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加库存弹窗 */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-3xl bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]">
              <h3 className="text-[18px] font-semibold text-[#e3e3e3]">添加库存</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex divide-x divide-[#3c3c3f]">
              {/* 左列：说明 */}
              <div className="w-56 p-6 flex flex-col gap-3">
                <p className="text-[13px] font-semibold text-[#9aa0a6]">使用说明</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#7CFF00] shrink-0" />
                    每行一个账号
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#7CFF00] shrink-0" />
                    自动按行分割
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#7CFF00] shrink-0" />
                    支持批量粘贴
                  </li>
                </ul>
              </div>

              {/* 右列：输入区 + 按钮 */}
              <div className="flex-1 p-6 flex flex-col gap-4">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={"账号1\n账号2\n账号3"}
                  rows={8}
                  className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00] resize-none"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-5 h-11 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] font-semibold rounded-xl transition-colors text-[14px]"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddInventory}
                    disabled={adding || !newContent.trim()}
                    className="px-5 h-11 bg-[#7CFF00] text-[#131314] rounded-xl font-semibold hover:bg-[#9FFF40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-[14px]"
                  >
                    {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                    添加库存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
