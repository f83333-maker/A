"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Package, Loader2, X, Search, AlertTriangle, TrendingUp, Database, CheckSquare, Square, Layers } from "lucide-react"

interface Product {
  id: string
  name: string
  stock: number
  logo_data?: string
  logo_bg_color?: string
  icon_url?: string
  tag_label?: string
  category_id?: string
  category?: { name: string }
  price?: number
}

interface InventoryItem {
  id: string
  content: string
  status: "available" | "sold"
  created_at: string
}

interface InventoryStats {
  available: number
  sold: number
  total: number
}

export default function InventoryPage() {
  // 产品列表
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // 多选模式
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchContent, setBatchContent] = useState("")
  const [batchAdding, setBatchAdding] = useState(false)

  // 库存数据
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "available" | "sold">("all")
  const [stats, setStats] = useState<InventoryStats>({ available: 0, sold: 0, total: 0 })

  // 添加库存表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [adding, setAdding] = useState(false)

  // 库存多选
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const res = await fetch("/api/admin/products")
      const data = await res.json()
      if (Array.isArray(data)) {
        setProducts(data)
      } else if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("获取产品失败:", error)
    } finally {
      setProductsLoading(false)
    }
  }

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories")
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data)
      }
    } catch (error) {
      console.error("[v0] 获取分类失败:", error)
    }
  }

  // 获取产品库存
  const fetchInventory = async (productId: string) => {
    try {
      setInventoryLoading(true)
      const res = await fetch(`/api/admin/inventory?productId=${productId}`)
      const data = await res.json()
      if (data.inventory) {
        setInventory(data.inventory)
        setStats(data.stats || { available: 0, sold: 0, total: 0 })
      }
    } catch (error) {
      console.error("获取库存失败:", error)
    } finally {
      setInventoryLoading(false)
    }
  }

  // 同步库存
  const handleSyncInventory = async () => {
    if (!confirm("确定要同步所有产品的库存吗？")) return
    try {
      setProductsLoading(true)
      const res = await fetch("/api/admin/inventory/sync", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        alert(`已同步 ${data.syncedCount} 个产品的库存`)
        await fetchProducts()
      } else {
        alert(data.error || "同步失败")
      }
    } catch (error) {
      alert("同步失败")
    } finally {
      setProductsLoading(false)
    }
  }

  // 添加库存
  const handleAddInventory = async () => {
    if (!newContent.trim() || !selectedProduct) return
    try {
      setAdding(true)
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, content: newContent })
      })
      const data = await res.json()
      if (data.success) {
        setNewContent("")
        setShowAddForm(false)
        await fetchInventory(selectedProduct.id)
        await fetchProducts()
      } else {
        alert(data.error || "添加失败")
      }
    } catch (error) {
      alert("添加失败")
    } finally {
      setAdding(false)
    }
  }

  // 删除库存
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条库存吗？") || !selectedProduct) return
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}&productId=${selectedProduct.id}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        await fetchInventory(selectedProduct.id)
        await fetchProducts()
      } else {
        alert(data.error || "删除失败")
      }
    } catch (error) {
      alert("删除失败")
    }
  }

  // 切换单条库存选中
  const toggleInventorySelect = (id: string) => {
    setSelectedInventoryIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 全选/取消全选当前筛选的库存
  const toggleSelectAll = (items: InventoryItem[]) => {
    if (items.every(item => selectedInventoryIds.has(item.id))) {
      setSelectedInventoryIds(new Set())
    } else {
      setSelectedInventoryIds(new Set(items.map(item => item.id)))
    }
  }

  // 批量删除选中的库存
  const handleBatchDelete = async () => {
    if (selectedInventoryIds.size === 0 || !selectedProduct) return
    if (!confirm(`确定要删除选中的 ${selectedInventoryIds.size} 条库存吗？`)) return
    setBatchDeleting(true)
    try {
      await Promise.all(
        Array.from(selectedInventoryIds).map(id =>
          fetch(`/api/admin/inventory?id=${id}&productId=${selectedProduct.id}`, { method: "DELETE" })
        )
      )
      setSelectedInventoryIds(new Set())
      await fetchInventory(selectedProduct.id)
      await fetchProducts()
    } catch (error) {
      alert("批量删除失败")
    } finally {
      setBatchDeleting(false)
    }
  }

  // 批量同步货源
  const handleBatchSync = async () => {
    if (selectedIds.size === 0) { alert("请先选择产品"); return }
    if (!batchContent.trim()) { alert("请输入货源内容"); return }
    try {
      setBatchAdding(true)
      const res = await fetch("/api/admin/inventory/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selectedIds), content: batchContent })
      })
      const data = await res.json()
      if (data.success) {
        setShowBatchModal(false)
        setBatchContent("")
        setBatchMode(false)
        setSelectedIds(new Set())
        await fetchProducts()
        alert(`已向 ${data.productCount} 个产品各添加 ${data.linesPerProduct} 条货源，共添加 ${data.totalAdded} 条`)
      } else {
        alert(data.error || "批量同步失败")
      }
    } catch (error) {
      alert("批量同步失败")
    } finally {
      setBatchAdding(false)
    }
  }

  // 切换单个产品选中
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 全选 / 取消全选（当前可见产品）
  const toggleSelectAllProducts = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  // 退出批量模式时清空选中
  const exitBatchMode = () => {
    setBatchMode(false)
    setSelectedIds(new Set())
  }

  // 初始化加载
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // 选中产品时获取库存
  useEffect(() => {
    if (selectedProduct) {
      fetchInventory(selectedProduct.id)
    } else {
      setInventory([])
      setStats({ available: 0, sold: 0, total: 0 })
    }
  }, [selectedProduct?.id])

  // 计算统计数据
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  // 过滤产品
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStock = filterStock === "all" ? true :
      filterStock === "low" ? (p.stock > 0 && p.stock <= 10) :
      p.stock === 0
    const matchCategory = filterCategory === "all" ? true : p.category_id === filterCategory
    return matchSearch && matchStock && matchCategory
  })

  // 过滤库存
  const filteredInventory = inventory.filter(item => {
    if (inventoryFilter === "all") return true
    return item.status === inventoryFilter
  })

  const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length

  return (
    <div className="h-full flex flex-col bg-[#0d0e0f]">
      {/* 顶部 */}
      <div className="shrink-0 px-6 py-5 border-b border-[#3c3c3f]/50">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-bold text-[#e3e3e3]">库存管理</h1>
            <p className="text-[13px] text-[#6e6e73] mt-0.5">管理所有产品的库存数据</p>
          </div>
          <button
            onClick={handleSyncInventory}
            disabled={productsLoading}
            className="h-10 px-4 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 disabled:opacity-50 text-[#7CFF00] font-semibold rounded-lg text-[13px] transition-colors flex items-center gap-2"
          >
            {productsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            同步库存
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1e1f20] border border-[#3c3c3f]/60 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7CFF00]/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-[#7CFF00]" />
              </div>
              <div>
                <p className="text-[11px] text-[#6e6e73] uppercase tracking-wide">总库存</p>
                <p className="text-[22px] font-bold text-[#e3e3e3]">{totalStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1f20] border border-[#3c3c3f]/60 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#81c995]/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#81c995]" />
              </div>
              <div>
                <p className="text-[11px] text-[#6e6e73] uppercase tracking-wide">产品数量</p>
                <p className="text-[22px] font-bold text-[#e3e3e3]">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1f20] border border-[#3c3c3f]/60 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f9ab00]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#f9ab00]" />
              </div>
              <div>
                <p className="text-[11px] text-[#6e6e73] uppercase tracking-wide">库存偏低</p>
                <p className="text-[22px] font-bold text-[#f9ab00]">{lowStockCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1f20] border border-[#3c3c3f]/60 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ee675c]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ee675c]" />
              </div>
              <div>
                <p className="text-[11px] text-[#6e6e73] uppercase tracking-wide">已缺货</p>
                <p className="text-[22px] font-bold text-[#ee675c]">{outOfStockCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体：左右分栏 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧：产品列表 */}
        <div className="w-[320px] border-r border-[#3c3c3f]/50 flex flex-col">
          {/* 搜索和筛选 */}
          <div className="shrink-0 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索产品..."
                className="w-full h-9 pl-9 pr-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[13px] placeholder-[#6e6e73] focus:outline-none focus:border-[#7CFF00]/50"
              />
            </div>
            {/* 分类筛选 */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-9 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[13px] focus:outline-none focus:border-[#7CFF00]/50 appearance-none cursor-pointer"
            >
              <option value="all">全部分类 ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* 库存状态筛选 */}
            <div className="flex gap-1.5">
              {[
                { key: "all", label: "全部" },
                { key: "low", label: "库存偏低" },
                { key: "out", label: "已缺货" }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilterStock(item.key as any)}
                  className={`flex-1 h-8 flex items-center justify-center px-2 rounded-lg text-[11px] font-medium transition-colors ${
                    filterStock === item.key
                      ? "bg-[#7CFF00]/15 text-[#7CFF00]"
                      : "bg-[#2d2e30] text-[#6e6e73] hover:text-[#9aa0a6]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 批量模式操作栏 */}
            {!batchMode ? (
              <button
                onClick={() => setBatchMode(true)}
                className="w-full h-8 flex items-center justify-center gap-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] border border-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] rounded-lg text-[12px] font-medium transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                批量添加货源
              </button>
            ) : (
              <div className="space-y-2">
                {/* 全选 + 已选数量 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleSelectAllProducts}
                    className="flex items-center gap-1.5 text-[12px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
                  >
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-[#7CFF00]" />
                      : <Square className="w-4 h-4" />
                    }
                    {allSelected ? "取消全选" : "全选"}
                  </button>
                  <span className="text-[12px] text-[#6e6e73]">
                    已选 <span className="text-[#7CFF00] font-semibold">{selectedIds.size}</span> 个
                  </span>
                </div>
                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={exitBatchMode}
                    className="flex-1 h-8 flex items-center justify-center bg-[#2d2e30] hover:bg-[#3c3c3f] border border-[#3c3c3f] text-[#9aa0a6] rounded-lg text-[12px] font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      if (selectedIds.size === 0) { alert("请先选择产品"); return }
                      setShowBatchModal(true)
                    }}
                    disabled={selectedIds.size === 0}
                    className="flex-1 h-8 flex items-center justify-center gap-1 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 disabled:opacity-40 disabled:cursor-not-allowed text-[#7CFF00] rounded-lg text-[12px] font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加货源
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 产品列表 */}
          <div className="flex-1 overflow-y-auto">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-[#6e6e73] text-[13px]">
                暂无产品
              </div>
            ) : (
              <div className="divide-y divide-[#3c3c3f]/30">
                {filteredProducts.map(product => {
                  const isSelected = selectedIds.has(product.id)
                  const isActive = !batchMode && selectedProduct?.id === product.id
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (batchMode) {
                          toggleSelect(product.id)
                        } else {
                          setSelectedProduct(product)
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors border-l-2 ${
                        isActive
                          ? "bg-[#7CFF00]/10 border-l-[#7CFF00]"
                          : batchMode && isSelected
                          ? "bg-[#7CFF00]/8 border-l-[#7CFF00]/60"
                          : "hover:bg-[#1e1f20] border-l-transparent"
                      }`}
                    >
                      {/* 多选模式下的复选框 */}
                      {batchMode && (
                        <div className="shrink-0">
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-[#7CFF00]" />
                            : <Square className="w-4 h-4 text-[#4a4a4d]" />
                          }
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {product.icon_url && (
                            <img
                              src={product.icon_url}
                              alt=""
                              className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                            />
                          )}
                          <p className="text-[13px] font-medium text-[#e3e3e3] truncate">{product.name}</p>
                          {product.tag_label && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#FF3B3B]/20 text-[#FF3B3B] shrink-0">
                              {product.tag_label}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${product.stock > 0 ? "text-[#81c995]" : "text-[#ee675c]"}`}>
                          库存: {product.stock}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：库存详情 */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedProduct ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#2d2e30] flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-[#4a4a4d]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#e3e3e3] mb-2">选择产品查看库存</h3>
              <p className="text-[13px] text-[#6e6e73] max-w-xs">
                从左侧列表选择一个产品，即可查看和管理该产品的库存详情
              </p>
            </div>
          ) : (
            <>
              {/* 产品信息头部 */}
              <div className="shrink-0 px-6 py-4 border-b border-[#3c3c3f]/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {selectedProduct.icon_url && (
                        <img src={selectedProduct.icon_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                      )}
                      <h2 className="text-[16px] font-semibold text-[#e3e3e3]">{selectedProduct.name}</h2>
                      {selectedProduct.tag_label && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#FF3B3B]/20 text-[#FF3B3B] shrink-0">
                          {selectedProduct.tag_label}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6e6e73]">售价: ¥{selectedProduct.price || 0}</p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="h-9 px-4 bg-[#7CFF00]/10 text-[#7CFF00] rounded-lg font-semibold text-[13px] hover:bg-[#7CFF00]/20 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    添加库存
                  </button>
                </div>

                {/* 库存统计 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1e1f20] rounded-lg p-3">
                    <p className="text-[11px] text-[#6e6e73] mb-1">当前库存</p>
                    <p className="text-[18px] font-bold text-[#e3e3e3]">{selectedProduct.stock}</p>
                  </div>
                  <div className="bg-[#1e1f20] rounded-lg p-3">
                    <p className="text-[11px] text-[#6e6e73] mb-1">可用</p>
                    <p className="text-[18px] font-bold text-[#81c995]">{stats.available}</p>
                  </div>
                  <div className="bg-[#1e1f20] rounded-lg p-3">
                    <p className="text-[11px] text-[#6e6e73] mb-1">已售</p>
                    <p className="text-[18px] font-bold text-[#6e6e73]">{stats.sold}</p>
                  </div>
                </div>
              </div>

              {/* 库存筛选 tab */}
              <div className="shrink-0 flex items-center gap-1 px-6 py-2 border-b border-[#3c3c3f]/50 bg-[#151617]">
                {[
                  { key: "all", label: "全部", count: stats.total },
                  { key: "available", label: "可用", count: stats.available },
                  { key: "sold", label: "已售", count: stats.sold }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setInventoryFilter(item.key as any)}
                    className={`h-8 flex items-center justify-center px-3 rounded-lg text-[12px] font-medium transition-all ${
                      inventoryFilter === item.key
                        ? "bg-[#7CFF00]/15 text-[#7CFF00]"
                        : "text-[#6e6e73] hover:text-[#9aa0a6]"
                    }`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  {selectedInventoryIds.size > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      disabled={batchDeleting}
                      className="h-7 flex items-center gap-1 px-2.5 bg-[#ee675c]/15 hover:bg-[#ee675c]/25 text-[#ee675c] rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
                    >
                      {batchDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      删除 {selectedInventoryIds.size} 条
                    </button>
                  )}
                  <button
                    onClick={() => toggleSelectAll(filteredInventory)}
                    className="h-7 flex items-center gap-1.5 px-2.5 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] rounded-lg text-[11px] font-medium transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      filteredInventory.length > 0 && filteredInventory.every(i => selectedInventoryIds.has(i.id))
                        ? "bg-[#7CFF00] border-[#7CFF00]"
                        : "border-[#6e6e73]"
                    }`}>
                      {filteredInventory.length > 0 && filteredInventory.every(i => selectedInventoryIds.has(i.id)) && (
                        <svg className="w-2.5 h-2.5 text-[#131314]" fill="none" viewBox="0 0 10 10">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {filteredInventory.length > 0 && filteredInventory.every(i => selectedInventoryIds.has(i.id)) ? "取消全选" : "全选"}
                  </button>
                </div>
              </div>

              {/* 库存项目列表 */}
              <div className="flex-1 overflow-y-auto">
                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-12 text-[#6e6e73] text-[13px]">
                    暂无库存记录
                  </div>
                ) : (
                  <div className="divide-y divide-[#3c3c3f]/30">
                    {filteredInventory.map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-6 py-2 hover:bg-[#1e1f20]/50 group transition-colors">
                        <button
                          onClick={() => toggleInventorySelect(item.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            selectedInventoryIds.has(item.id)
                              ? "bg-[#7CFF00] border-[#7CFF00]"
                              : "border-[#4a4a4d] hover:border-[#7CFF00]/60"
                          }`}
                        >
                          {selectedInventoryIds.has(item.id) && (
                            <svg className="w-2.5 h-2.5 text-[#131314]" fill="none" viewBox="0 0 10 10">
                              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <p className="text-[12px] font-mono text-[#e3e3e3] truncate">{item.content}</p>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#FF3B3B]/20 text-[#FF3B3B] shrink-0 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          item.status === "available"
                            ? "bg-[#81c995]/10 text-[#81c995]"
                            : "bg-[#6e6e73]/10 text-[#6e6e73]"
                        }`}>
                          {item.status === "available" ? "可用" : "已售"}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-[#6e6e73] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 单产品添加库存弹窗 */}
      {showAddForm && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gradient-to-b from-[#1e1f20] to-[#151617] rounded-2xl border border-[#3c3c3f]/60 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]/50">
              <h3 className="text-[16px] font-semibold text-[#e3e3e3]">添加库存 - {selectedProduct.name}</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 text-[#6e6e73] hover:text-[#e3e3e3] hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  库存内容 <span className="text-[#6e6e73] font-normal">（每行一条）</span>
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={"例如：ABC123\nDEF456\nGHI789"}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#0d0e0f] border border-[#3c3c3f]/60 rounded-xl text-[#e3e3e3] placeholder-[#4a4a4d] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00]/50 focus:ring-1 focus:ring-[#7CFF00]/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 h-10 bg-[#2d2e30] hover:bg-[#3c3c3f] border border-[#3c3c3f] text-[#e3e3e3] rounded-xl font-semibold text-[13px] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddInventory}
                  disabled={adding || !newContent.trim()}
                  className="flex-1 h-10 bg-[#7CFF00]/10 text-[#7CFF00] rounded-xl font-semibold hover:bg-[#7CFF00]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-[13px]"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  添加库存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量添加货源弹窗 */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#1e1f20] to-[#151617] rounded-2xl border border-[#3c3c3f]/60 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]/50">
              <div>
                <h3 className="text-[16px] font-semibold text-[#e3e3e3]">批量添加货源</h3>
                <p className="text-[12px] text-[#6e6e73] mt-0.5">
                  将以下货源分别同步给已选中的 <span className="text-[#7CFF00] font-semibold">{selectedIds.size}</span> 个产品
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 text-[#6e6e73] hover:text-[#e3e3e3] hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 已选产品预览 */}
            <div className="px-6 py-3 border-b border-[#3c3c3f]/50 bg-[#0d0e0f]/50">
              <p className="text-[11px] text-[#6e6e73] mb-2 uppercase tracking-wide">已选产品</p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {Array.from(selectedIds).map(id => {
                  const p = products.find(x => x.id === id)
                  if (!p) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-[#2d2e30] rounded-lg text-[11px] text-[#e3e3e3]">
                      {p.icon_url && <img src={p.icon_url} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                      <span className="max-w-[120px] truncate">{p.name}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  通用货源内容 <span className="text-[#6e6e73] font-normal">（每行一条，将各自复制给每个产品）</span>
                </label>
                <textarea
                  value={batchContent}
                  onChange={(e) => setBatchContent(e.target.value)}
                  placeholder={"例如：ABC123\nDEF456\nGHI789"}
                  rows={8}
                  autoFocus
                  className="w-full px-4 py-3 bg-[#0d0e0f] border border-[#3c3c3f]/60 rounded-xl text-[#e3e3e3] placeholder-[#4a4a4d] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00]/50 focus:ring-1 focus:ring-[#7CFF00]/20 resize-none"
                />
                {batchContent.trim() && (
                  <p className="text-[11px] text-[#6e6e73] mt-1.5">
                    共 <span className="text-[#7CFF00]">{batchContent.split("\n").filter(l => l.trim()).length}</span> 条货源，
                    将分发给 <span className="text-[#7CFF00]">{selectedIds.size}</span> 个产品，
                    合计添加 <span className="text-[#7CFF00]">{batchContent.split("\n").filter(l => l.trim()).length * selectedIds.size}</span> 条
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 h-10 bg-[#2d2e30] hover:bg-[#3c3c3f] border border-[#3c3c3f] text-[#e3e3e3] rounded-xl font-semibold text-[13px] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchSync}
                  disabled={batchAdding || !batchContent.trim()}
                  className="flex-1 h-10 bg-[#7CFF00]/10 text-[#7CFF00] rounded-xl font-semibold hover:bg-[#7CFF00]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-[13px]"
                >
                  {batchAdding && <Loader2 className="w-4 h-4 animate-spin" />}
                  确认批量同步
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
