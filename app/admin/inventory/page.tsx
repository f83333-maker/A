"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Package, CheckCircle, Clock, Loader2, X, Search, ChevronRight, AlertTriangle, TrendingUp, Database } from "lucide-react"

interface Product {
  id: string
  name: string
  stock: number
  sales: number
  logo_data?: string
  logo_bg_color?: string
  is_active: boolean
  category?: { name: string }
}

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
  // 产品列表
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all")

  // 选中的产品
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // 库存数据
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({ available: 0, sold: 0, total: 0 })
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "available" | "sold">("all")

  // 添加库存
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [adding, setAdding] = useState(false)

  // 获取所有产品
  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await fetch("/api/admin/products")
      const data = await res.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("获取产品失败:", error)
    } finally {
      setProductsLoading(false)
    }
  }

  // 获取产品库存
  const fetchInventory = async (productId: string) => {
    setInventoryLoading(true)
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
      setInventoryLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchInventory(selectedProduct.id)
    } else {
      setInventory([])
      setStats({ available: 0, sold: 0, total: 0 })
    }
  }, [selectedProduct])

  // 添加库存
  const handleAddInventory = async () => {
    if (!newContent.trim() || !selectedProduct) return
    setAdding(true)
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, content: newContent })
      })
      const data = await res.json()
      if (data.success) {
        setNewContent("")
        setShowAddForm(false)
        fetchInventory(selectedProduct.id)
        fetchProducts() // 刷新产品列表以更新库存数量
      } else {
        alert(data.error || "添加失败")
      }
    } catch (error) {
      alert("添加失败")
    } finally {
      setAdding(false)
    }
  }

  // 同步库存：根据inventory表重新计算所有产品的库存
  const handleSyncInventory = async () => {
    if (!confirm("确定要同步所有产品的库存吗？这会根据库存记录重新计算每个产品的库存数量。")) return
    setProductsLoading(true)
    try {
      const res = await fetch("/api/admin/inventory/sync", {
        method: "POST"
      })
      const data = await res.json()
      if (data.success) {
        alert(`已同步 ${data.syncedCount} 个产品的库存`)
        fetchProducts()
      } else {
        alert(data.error || "同步失败")
      }
    } catch (error) {
      alert("同步失败")
    } finally {
      setProductsLoading(false)
    }
  }

  // 筛选产品
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStock = filterStock === "all" ? true :
      filterStock === "low" ? (p.stock > 0 && p.stock <= 10) :
      p.stock === 0
    return matchSearch && matchStock
  })

  // 筛选库存
  const filteredInventory = inventory.filter(item => {
    if (inventoryFilter === "all") return true
    return item.status === inventoryFilter
  })

  // 统计数据
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  return (
    <div className="h-full flex flex-col">
      {/* 顶部统计 */}
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

      {/* 主体内容：左右分栏 */}
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
            <div className="flex gap-1.5">
              {[
                { key: "all", label: "全部" },
                { key: "low", label: "库存偏低" },
                { key: "out", label: "已缺货" }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilterStock(item.key as typeof filterStock)}
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
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedProduct?.id === product.id
                        ? "bg-[#7CFF00]/10 border-l-2 border-l-[#7CFF00]"
                        : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                    }`}
                  >
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: product.logo_bg_color || '#2d2e30' }}
                    >
                      {product.logo_data ? (
                        <img src={product.logo_data} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <Package className="w-4 h-4 text-[#6e6e73]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#e3e3e3] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#6e6e73]">
                        {product.category?.name || "未分类"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[13px] font-semibold ${
                        product.stock === 0 ? "text-[#ee675c]" :
                        product.stock <= 10 ? "text-[#f9ab00]" :
                        "text-[#81c995]"
                      }`}>
                        {product.stock}
                      </span>
                      <p className="text-[10px] text-[#6e6e73]">库存</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
                      selectedProduct?.id === product.id ? "text-[#7CFF00]" : "text-[#3c3c3f]"
                    }`} />
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
              <div className="shrink-0 px-6 py-4 border-b border-[#3c3c3f]/50 bg-gradient-to-r from-[#7CFF00]/5 to-transparent">
                <div className="flex items-center justify-between">
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
                      <p className="text-[12px] text-[#6e6e73]">{selectedProduct.category?.name || "未分类"}</p>
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
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#6e6e73] uppercase tracking-wide">当前库存</span>
                    <span className="text-[20px] font-bold text-[#e3e3e3]">{selectedProduct.stock}</span>
                  </div>
                  <div className="w-px h-5 bg-[#3c3c3f]" />
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7CFF00]" />
                    <span className="text-[16px] font-semibold text-[#7CFF00]">{stats.available}</span>
                    <span className="text-[11px] text-[#6e6e73]">可用</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6e6e73]" />
                    <span className="text-[16px] font-semibold text-[#6e6e73]">{stats.sold}</span>
                    <span className="text-[11px] text-[#6e6e73]">已售</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#9aa0a6]" />
                    <span className="text-[16px] font-semibold text-[#9aa0a6]">{stats.total}</span>
                    <span className="text-[11px] text-[#6e6e73]">总记录</span>
                  </div>
                </div>
              </div>

              {/* 筛选栏 */}
              <div className="shrink-0 flex items-center gap-1 px-6 py-2 border-b border-[#3c3c3f]/50 bg-[#151617]">
                {[
                  { key: "all", label: "全部", count: stats.total },
                  { key: "available", label: "可用", count: stats.available },
                  { key: "sold", label: "已售出", count: stats.sold }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setInventoryFilter(item.key as typeof inventoryFilter)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      inventoryFilter === item.key
                        ? "bg-[#7CFF00]/15 text-[#7CFF00]"
                        : "text-[#6e6e73] hover:text-[#9aa0a6] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    <span className={`ml-1.5 text-[10px] ${inventoryFilter === item.key ? "text-[#7CFF00]/60" : "text-[#4a4a4d]"}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* 库存列表 */}
              <div className="flex-1 overflow-y-auto">
                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#2d2e30] flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#4a4a4d]" />
                    </div>
                    <p className="text-[#6e6e73] text-[13px]">暂无库存数据</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-2 text-[#7CFF00] text-[13px] hover:underline"
                    >
                      添加库存
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#3c3c3f]/30">
                    {filteredInventory.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-4 px-6 py-2.5 hover:bg-white/[0.02] transition-colors group">
                        <span className="text-[10px] text-[#4a4a4d] w-6 text-right font-mono">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <code className="text-[12px] text-[#e3e3e3] font-mono truncate block">{item.content}</code>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.status === "available" 
                            ? "bg-[#7CFF00]/10 text-[#7CFF00]" 
                            : "bg-[#3c3c3f]/50 text-[#6e6e73]"
                        }`}>
                          {item.status === "available" ? (
                            <><Clock className="w-3 h-3" /> 可用</>
                          ) : (
                            <><CheckCircle className="w-3 h-3" /> 已售</>
                          )}
                        </span>
                        <span className="text-[10px] text-[#4a4a4d] shrink-0 w-20">
                          {new Date(item.created_at).toLocaleDateString("zh-CN")}
                        </span>
                        {item.status === "available" && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="shrink-0 p-1.5 text-[#6e6e73] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#1e1f20] to-[#151617] rounded-2xl border border-[#3c3c3f]/60 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]/50">
              <div>
                <h3 className="text-[16px] font-semibold text-[#e3e3e3]">添加库存</h3>
                <p className="text-[12px] text-[#6e6e73] mt-0.5">{selectedProduct.name}</p>
              </div>
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
                  库存内容 <span className="text-[#6e6e73] font-normal">（每行一条，支持批量粘贴）</span>
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={"账号1----密码1\n账号2----密码2\n账号3----密码3"}
                  rows={10}
                  className="w-full px-4 py-3 bg-[#0d0e0f] border border-[#3c3c3f]/60 rounded-xl text-[#e3e3e3] placeholder-[#4a4a4d] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00]/50 focus:ring-1 focus:ring-[#7CFF00]/20 resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6e6e73]">
                  {newContent.trim() ? `将添加 ${newContent.split("\n").filter(l => l.trim()).length} 条库存` : ""}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-5 h-10 bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#e3e3e3] font-medium rounded-xl transition-colors text-[13px]"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddInventory}
                    disabled={adding || !newContent.trim()}
                    className="px-5 h-10 bg-[#7CFF00] text-[#131314] rounded-xl font-semibold hover:bg-[#9FFF40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-[13px]"
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
