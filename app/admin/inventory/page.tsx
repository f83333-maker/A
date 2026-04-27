"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Package, Loader2, X, Search, AlertTriangle, TrendingUp, Database } from "lucide-react"

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

  // 库存数据
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "available" | "sold">("all")
  const [stats, setStats] = useState<InventoryStats>({ available: 0, sold: 0, total: 0 })

  // 添加库存表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [adding, setAdding] = useState(false)

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const res = await fetch("/api/admin/products")
      const data = await res.json()
      // API直接返回数组，不是 { products: [...] }
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
      
      // API 直接返回数组
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
            className="h-10 px-4 bg-[#7CFF00] hover:bg-[#9FFF40] disabled:opacity-50 text-[#131314] font-semibold rounded-lg text-[13px] transition-colors flex items-center gap-2"
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
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    filterStock === item.key
                      ? "bg-[#7CFF00]/15 text-[#7CFF00]"
                      : "bg-[#2d2e30] text-[#6e6e73] hover:text-[#9aa0a6]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                      selectedProduct?.id === product.id
                        ? "bg-[#7CFF00]/10 border-l-2 border-l-[#7CFF00]"
                        : "hover:bg-[#1e1f20] border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* 国旗图标（与产品管理一致） */}
                    {product.icon_url ? (
                      <img
                        src={product.icon_url}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                        style={{ backgroundColor: product.logo_bg_color || "#2d2e30" }}
                      >
                        {product.logo_data ? (
                          <img src={product.logo_data} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-[#6e6e73]" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
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
                ))}
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
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: selectedProduct.logo_bg_color || '#2d2e30' }}
                    >
                      {selectedProduct.logo_data ? (
                        <img src={selectedProduct.logo_data} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <Package className="w-5 h-5 text-[#6e6e73]" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#e3e3e3]">{selectedProduct.name}</h2>
                      <p className="text-[12px] text-[#6e6e73]">售价: ¥{selectedProduct.price || 0}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="h-9 px-4 bg-[#7CFF00] text-[#131314] rounded-lg font-semibold text-[13px] hover:bg-[#9FFF40] transition-colors flex items-center gap-1.5"
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

              {/* 库存列表 */}
              <div className="shrink-0 flex items-center gap-1 px-6 py-2 border-b border-[#3c3c3f]/50 bg-[#151617]">
                {[
                  { key: "all", label: "全部", count: stats.total },
                  { key: "available", label: "可用", count: stats.available },
                  { key: "sold", label: "已售", count: stats.sold }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setInventoryFilter(item.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      inventoryFilter === item.key
                        ? "bg-[#7CFF00]/15 text-[#7CFF00]"
                        : "text-[#6e6e73] hover:text-[#9aa0a6]"
                    }`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
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
                      <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#1e1f20]/50 group transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-mono text-[#e3e3e3] truncate">{item.content}</p>
                          <p className={`text-[11px] mt-1 ${item.status === "available" ? "text-[#81c995]" : "text-[#9aa0a6]"}`}>
                            {item.status === "available" ? "可用" : "已售"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="ml-3 p-1.5 text-[#6e6e73] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* 添加库存弹窗 */}
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
                  placeholder="例如：ABC123&#10;DEF456&#10;GHI789"
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
                  className="flex-1 h-10 bg-[#7CFF00] text-[#131314] rounded-xl font-semibold hover:bg-[#9FFF40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-[13px]"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  添加库存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
