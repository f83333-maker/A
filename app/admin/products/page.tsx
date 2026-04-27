"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Package, ArrowUp, ArrowDown, Flag, Search, BookmarkPlus, BookOpen, ChevronDown, Clock, CheckCircle, Copy } from "lucide-react"
import Link from "next/link"

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

interface Category {
  id: string
  name: string
}

interface ProductTemplate {
  id: string
  name: string
  data: typeof initialFormData
  created_at: string
}

const initialFormData = {
  name: "",
  description: "",
  price: 0,
  cost_price: 0,
  stock: 0,
  sales: 0,
  tag_label: "",
  is_active: true,
  category_id: "",
  product_info: "",
  usage_instructions: "",
  logo_data: "",
  logo_bg_color: "#2d2e30",
  delivery_type: "自动发货",
  icon_url: "",
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price: number
  cost_price: number
  stock: number
  sales: number
  tags: string[]
  is_hot: boolean
  is_active: boolean
  category_id: string
  product_info: string
  usage_instructions: string
  logo_url: string
  logo_data: string | null
  logo_bg_color: string | null
  icon_url: string | null
  tag_label: string | null
  delivery_type: string
  sort_order: number
  categories: { name: string } | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({ ...initialFormData })
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string>("")
  const [templates, setTemplates] = useState<ProductTemplate[]>([])
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState("")
  const [showSaveInput, setShowSaveInput] = useState(false)
  
  // 筛选状态
  const [filterCategoryId, setFilterCategoryId] = useState<string>("")
  const [statusTab, setStatusTab] = useState<"all" | "active" | "inactive">("all")
  const [searchName, setSearchName] = useState("")
  const [searchInput, setSearchInput] = useState("")
  
  // 国旗搜索状态
  const [flagSearchQuery, setFlagSearchQuery] = useState("")
  const [flagResults, setFlagResults] = useState<{ code: string; flagUrl: string; name: string }[]>([])
  const [isSearchingFlag, setIsSearchingFlag] = useState(false)

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  // 库存弹窗状态
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({ available: 0, sold: 0, total: 0 })
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryAdding, setInventoryAdding] = useState(false)
  const [newInventoryContent, setNewInventoryContent] = useState("")
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "available" | "sold">("all")

  // 从数据库加载模板
  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/templates")
      const data = await res.json()
      if (Array.isArray(data)) {
        setTemplates(data)
      }
    } catch (error) {
      console.error("加载模板失败:", error)
    }
  }

  // 保存模板到数据库
  const saveTemplate = async (name: string, data: typeof initialFormData) => {
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data }),
      })
      if (res.ok) {
        await fetchTemplates()
        return true
      }
      return false
    } catch (error) {
      console.error("保存模板失败:", error)
      return false
    }
  }

  // 删除模板
  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" })
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      }
    } catch (error) {
      console.error("删除模板失败:", error)
    }
  }

  useEffect(() => {
    fetchData()
    fetchTemplates()
    // 检查URL参数中的分类ID
    const params = new URLSearchParams(window.location.search)
    const categoryId = params.get("categoryId")
    if (categoryId) {
      setFilterCategoryId(categoryId)
    }
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个产品吗？此操作不可恢复。`)) return
    setIsBatchDeleting(true)
    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      ))
      setSelectedIds([])
      fetchData()
    } catch (error) {
      console.error("批量删除失败:", error)
    } finally {
      setIsBatchDeleting(false)
    }
  }

  const handleBatchToggleActive = async (active: boolean) => {
    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: active })
        })
      ))
      setSelectedIds([])
      fetchData()
    } catch (error) {
      console.error("批量更新失败:", error)
    }
  }

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ])
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      setProducts(Array.isArray(productsData) ? productsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setProducts([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  // 库存管理函数
  const openInventoryModal = async (product: Product) => {
    setInventoryProduct(product)
    setInventoryModalOpen(true)
    setInventoryFilter("all")
    setNewInventoryContent("")
    await fetchInventory(product.id)
  }

  const fetchInventory = async (productId: string) => {
    setInventoryLoading(true)
    try {
      const res = await fetch(`/api/admin/inventory?productId=${productId}`)
      const data = await res.json()
      if (data.inventory) {
        setInventory(data.inventory)
        setInventoryStats(data.stats)
      }
    } catch (error) {
      console.error("获取库存失败:", error)
    } finally {
      setInventoryLoading(false)
    }
  }

  const handleAddInventory = async () => {
    if (!newInventoryContent.trim() || !inventoryProduct) return
    setInventoryAdding(true)
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: inventoryProduct.id, content: newInventoryContent })
      })
      const data = await res.json()
      if (data.success) {
        setNewInventoryContent("")
        await fetchInventory(inventoryProduct.id)
        // 刷新产品列表更新库存数量
        fetchData()
      } else {
        alert(data.error || "添加失败")
      }
    } catch (error) {
      alert("添加失败")
    } finally {
      setInventoryAdding(false)
    }
  }

  const handleDeleteInventory = async (id: string) => {
    if (!confirm("确定要删除这条库存吗？") || !inventoryProduct) return
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}&productId=${inventoryProduct.id}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        await fetchInventory(inventoryProduct.id)
        fetchData()
      } else {
        alert(data.error || "删除失败")
      }
    } catch (error) {
      alert("删除失败")
    }
  }

  const filteredInventory = inventory.filter(item => {
    if (inventoryFilter === "all") return true
    return item.status === inventoryFilter
  })

  const openModal = (product?: Product) => {
    setError("")
    setFlagSearchQuery("")
    setFlagResults([])
    setShowTemplatePanel(false)
    setShowSaveInput(false)
    setSaveTemplateName("")
    fetchTemplates()
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        cost_price: product.cost_price || 0,
        stock: product.stock,
        sales: product.sales,
        tag_label: product.tag_label || product.tags?.[0] || "",
        is_active: product.is_active,
        category_id: product.category_id,
        product_info: product.product_info || "",
        usage_instructions: product.usage_instructions || "",
        logo_data: product.logo_data || "",
        logo_bg_color: product.logo_bg_color || "#2d2e30",
        delivery_type: product.delivery_type || "自动发货",
        icon_url: product.icon_url || "",
      })
      setLogoPreview(product.logo_data || null)
    } else {
      setEditingProduct(null)
      setFormData({ ...initialFormData, category_id: categories[0]?.id || "" })
      setLogoPreview(null)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 前端验证
    if (!formData.name.trim()) {
      setError("产品名称不能为空")
      return
    }
    if (!formData.category_id) {
      setError("Category is required")
      return
    }
    if (!formData.price || formData.price <= 0) {
      setError("请输入有效的价格")
      return
    }

    setIsSaving(true)

    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products"
      const method = editingProduct ? "PUT" : "POST"

      // 构建提交数据
      const submitData = {
        ...formData,
        tag_label: formData.tag_label?.trim() || null,
        tags: formData.tag_label ? [formData.tag_label.trim()] : [],
        is_hot: !!formData.tag_label, // 有标签就算热门
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const data = await res.json()

      if (res.ok) {
        setIsModalOpen(false)
        setError("")
        fetchData()
      } else {
        setError(data.error || "保存失败，请重试")
      }
    } catch (error) {
      console.error("Failed to save product:", error)
      setError("网络错误，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个产品吗？")) return

    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const sortedProducts = Array.isArray(products) ? [...products].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : []
    if (sortedProducts.length === 0) return
    const current = sortedProducts[index]
    const prev = sortedProducts[index - 1]
    
    try {
      await Promise.all([
        fetch(`/api/admin/products/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: prev.sort_order || index - 1 }),
        }),
        fetch(`/api/admin/products/${prev.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: current.sort_order || index }),
        }),
      ])
      fetchData()
    } catch (error) {
      console.error("Failed to move product:", error)
    }
  }

  const handleMoveDown = async (index: number) => {
    const sortedProducts = Array.isArray(products) ? [...products].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : []
    if (sortedProducts.length === 0 || index >= sortedProducts.length - 1) return
    const current = sortedProducts[index]
    const next = sortedProducts[index + 1]
    
    try {
      await Promise.all([
        fetch(`/api/admin/products/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: next.sort_order || index + 1 }),
        }),
        fetch(`/api/admin/products/${next.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: current.sort_order || index }),
        }),
      ])
      fetchData()
    } catch (error) {
      console.error("Failed to move product:", error)
    }
  }

  // 内联切换上下架状态（乐观更新）
  const handleToggleActive = (product: Product) => {
    if (!Array.isArray(products)) return
    const newValue = !product.is_active
    setProducts(prev => Array.isArray(prev) ? prev.map(p => p.id === product.id ? { ...p, is_active: newValue } : p) : [])
    fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newValue }),
    }).catch(() => {
      if (Array.isArray(products)) {
        setProducts(prev => Array.isArray(prev) ? prev.map(p => p.id === product.id ? { ...p, is_active: !newValue } : p) : [])
      }
    })
  }

  // 复制产品（预填表单打开弹窗）
  const handleDuplicate = (product: Product) => {
    setEditingProduct(null)
    setFormData({
      name: product.name + " - 副本",
      description: product.description || "",
      price: product.price,
      cost_price: product.cost_price || 0,
      stock: 0,
      sales: 0,
      tag_label: "",
      is_active: false,
      category_id: product.category_id || categories[0]?.id || "",
      product_info: product.product_info || "",
      usage_instructions: product.usage_instructions || "",
      logo_data: product.logo_data || "",
      logo_bg_color: product.logo_bg_color || "#2d2e30",
      delivery_type: product.delivery_type || "自动发货",
    })
    setLogoPreview(product.logo_data || null)
    setError("")
    setFlagSearchQuery("")
    setFlagResults([])
    setShowTemplatePanel(false)
    setShowSaveInput(false)
    setSaveTemplateName("")
    fetchTemplates()
    setIsModalOpen(true)
  }

  // 搜索国旗图片
  const searchCountryFlag = async () => {
    if (!flagSearchQuery.trim()) return
    setIsSearchingFlag(true)
    try {
      const res = await fetch("/api/country-emoji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: flagSearchQuery }),
      })
      const data = await res.json()
      setFlagResults(data.results || [])
    } catch (error) {
      console.error("搜索国旗失败:", error)
    } finally {
      setIsSearchingFlag(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    )
  }

  // 过滤后的产品列表
  const productList = Array.isArray(products) ? products : []
  const filteredProducts = [...productList]
    .filter(p => {
      if (statusTab === "active") return p.is_active
      if (statusTab === "inactive") return !p.is_active
      return true
    })
    .filter(p => !filterCategoryId || p.category_id === filterCategoryId)
    .filter(p => !searchName || p.name.toLowerCase().includes(searchName.toLowerCase()))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#e3e3e3]">产品管理</h1>
        <p className="text-[13px] text-[#9aa0a6] mt-0.5">共 {products.length} 个产品</p>
      </div>

      {/* 状态 Tab */}
      <div className="flex items-center gap-0 border-b border-[#3c3c3f]">
        {[
          { key: "all", label: "全部", count: products.length },
          { key: "active", label: "售卖中", count: products.filter(p => p.is_active).length },
          { key: "inactive", label: "已下架", count: products.filter(p => !p.is_active).length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key as typeof statusTab)}
            className={`h-11 inline-flex items-center px-4 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
              statusTab === tab.key
                ? "border-[#7CFF00] text-[#7CFF00]"
                : "border-transparent text-[#9aa0a6] hover:text-[#e3e3e3]"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-[11px] ${statusTab === tab.key ? "text-[#7CFF00]/70" : "text-[#6e6e73]"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-[#9aa0a6] shrink-0">商品名称</span>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") setSearchName(searchInput) }}
            placeholder="请输入商品名称"
            className="h-8 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[12px] focus:outline-none focus:border-[#7CFF00] transition-colors w-36"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-[#9aa0a6] shrink-0">商品分类</span>
          <select
            value={filterCategoryId}
            onChange={e => setFilterCategoryId(e.target.value)}
            className="h-8 px-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[12px] focus:outline-none focus:border-[#7CFF00] transition-colors"
          >
            <option value="">搜索商品分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSearchName(searchInput)}
          className="h-8 px-3 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 text-[#7CFF00] font-semibold rounded-lg text-[12px] transition-colors flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          搜索
        </button>
        <button
          onClick={() => openModal()}
          className="h-8 px-3 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 text-[#7CFF00] font-semibold rounded-lg text-[12px] transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          商品发布
        </button>
        <Link
          href="/admin/inventory"
          className="h-8 px-3 bg-[#2d2e30] hover:bg-[#3c3c3f] border border-[#3c3c3f] text-[#e3e3e3] font-medium rounded-lg text-[12px] transition-colors flex items-center gap-1.5"
        >
          <Package className="w-3.5 h-3.5 text-[#81c995]" />
          库存管理
        </Link>
        {(searchName || filterCategoryId) && (
          <button
            onClick={() => { setSearchName(""); setSearchInput(""); setFilterCategoryId("") }}
            className="h-8 px-2 text-[12px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 批量操作条 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#7CFF00]/8 border border-[#7CFF00]/20 rounded-xl">
          <span className="text-[12px] text-[#7CFF00] font-medium">已选 {selectedIds.length} 个产品</span>
          <div className="w-px h-4 bg-[#3c3c3f]" />
          <button
            onClick={() => handleBatchToggleActive(true)}
            className="text-[12px] text-[#81c995] hover:text-[#a8d4b8] transition-colors font-medium"
          >
            批量上架
          </button>
          <button
            onClick={() => handleBatchToggleActive(false)}
            className="text-[12px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors font-medium"
          >
            批量下架
          </button>
          <button
            onClick={handleBatchDelete}
            disabled={isBatchDeleting}
            className="flex items-center gap-1 text-[12px] text-[#ee675c] hover:text-[#f08c83] transition-colors font-medium disabled:opacity-50"
          >
            {isBatchDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
            批量删除
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-[12px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 产品列表 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3c3c3f] bg-[#2d2e30]/40">
                <th className="pl-3 pr-1 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    ref={el => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < filteredProducts.length }}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded accent-[#7CFF00] cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left text-[13px] font-semibold text-[#9aa0a6]">商品信息</th>
                <th className="px-3 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] w-32">操作</th>
                <th className="px-3 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] w-20">售价</th>
                <th className="px-3 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] w-32">状态</th>
                <th className="px-3 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] w-14">销量</th>
                <th className="px-3 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] w-24">库存</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c3c3f]/50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#6e6e73] text-[12px]">暂无产品</td>
                </tr>
              ) : filteredProducts.map((product, index) => (
                <tr key={product.id} className={`hover:bg-[#2d2e30]/30 transition-colors h-10 ${selectedIds.includes(product.id) ? "bg-[#7CFF00]/5" : ""}`}>
                  {/* 复选框 */}
                  <td className="pl-3 pr-1 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded accent-[#7CFF00] cursor-pointer"
                    />
                  </td>
                  {/* 商品信息 */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {/* 排序按钮 */}
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-[#5f6368] hover:text-[#7CFF00] rounded disabled:opacity-20 transition-all"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === filteredProducts.length - 1}
                          className="p-1 text-[#5f6368] hover:text-[#7CFF00] rounded disabled:opacity-20 transition-all"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* 国旗图标 */}
                      {product.icon_url && (
                        <img 
                          src={product.icon_url} 
                          alt="" 
                          className="w-6 h-4 object-cover rounded-sm shrink-0"
                        />
                      )}
                      {/* 产品名称 */}
                      <span className="text-[14px] font-medium text-[#e3e3e3] truncate max-w-[280px]" title={product.name}>
                        {product.name}
                      </span>
                      {/* 标签 */}
                      {product.tag_label && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#FF3B3B]/20 text-[#FF3B3B] shrink-0">
                          {product.tag_label}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* 操作 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(product)}
                        className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#7CFF00] transition-colors"
                      >
                        编辑
                      </button>
                      <span className="text-[#3c3c3f]">|</span>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#7CFF00] transition-colors"
                      >
                        复制
                      </button>
                      <span className="text-[#3c3c3f]">|</span>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#ee675c] transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                  {/* 售价 */}
                  <td className="px-3 py-2">
                    <span className="text-[14px] font-semibold text-[#e3e3e3]">{product.price}</span>
                  </td>
                  {/* 状态 */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${product.is_active ? "text-[#81c995]" : "text-[#6e6e73]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${product.is_active ? "bg-[#81c995]" : "bg-[#6e6e73]"}`} />
                        {product.is_active ? "销售中" : "已下架"}
                      </span>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className="px-2 py-0.5 text-[12px] font-medium bg-[#3c3c3f]/60 text-[#9aa0a6] hover:text-[#7CFF00] rounded-md transition-colors"
                      >
                        {product.is_active ? "下架" : "上架"}
                      </button>
                    </div>
                  </td>
                  {/* 销量 */}
                  <td className="px-3 py-2">
                    <span className="text-[14px] text-[#9aa0a6]">{product.sales || 0}</span>
                  </td>
                  {/* 库存 */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-semibold px-2 py-0.5 rounded-md ${product.stock > 0 ? "bg-[#81c995]/10 text-[#81c995]" : "bg-[#ee675c]/10 text-[#ee675c]"}`}>
                        {product.stock}
                      </span>
                      <button
                        onClick={() => openInventoryModal(product)}
                        className="px-2 py-0.5 text-[12px] font-medium bg-[#3c3c3f]/60 text-[#9aa0a6] hover:text-[#7CFF00] rounded-md transition-colors"
                      >
                        库存
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f] shrink-0">
              <h2 className="text-[18px] font-semibold text-[#e3e3e3]">
                {editingProduct ? "编辑产品" : "添加产品"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">

              {/* 模板工具栏 - 仅添加模式显示 */}
              {!editingProduct && (
                <div className="flex items-center gap-2 px-6 pt-4 shrink-0">
                  {/* 选择模板 */}
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => { setShowTemplatePanel(v => !v); setShowSaveInput(false) }}
                      className="w-full flex items-center justify-between gap-2 px-3 h-9 bg-[#2d2e30] border border-[#3c3c3f] hover:border-[#7CFF00]/50 rounded-xl text-[13px] text-[#9aa0a6] font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#7CFF00]" />
                        {templates.length > 0 ? `选择模板（${templates.length}）` : "暂无模板"}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTemplatePanel ? "rotate-180" : ""}`} />
                    </button>
                    {showTemplatePanel && templates.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1f20] border border-[#3c3c3f] rounded-xl shadow-2xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                        {templates.map(tpl => (
                          <div key={tpl.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-[#2d2e30] transition-colors group">
                            <button
                              type="button"
                              className="flex-1 text-left text-[13px] text-[#e3e3e3] font-medium truncate"
                              onClick={() => {
                                setFormData({ ...tpl.data })
                                setLogoPreview(tpl.data.logo_data || null)
                                setShowTemplatePanel(false)
                              }}
                            >
                              {tpl.name}
                              <span className="ml-2 text-[11px] text-[#6e6e73]">{new Date(tpl.created_at).toLocaleDateString("zh-CN")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTemplate(tpl.id)}
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-[#6e6e73] hover:text-[#ee675c] transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {showTemplatePanel && templates.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1f20] border border-[#3c3c3f] rounded-xl shadow-2xl z-10 px-3 py-3 text-[13px] text-[#6e6e73] text-center">
                        还没有保存的模板
                      </div>
                    )}
                  </div>

                  {/* 保存模板 */}
                  {!showSaveInput ? (
                    <button
                      type="button"
                      onClick={() => { setShowSaveInput(true); setShowTemplatePanel(false); setSaveTemplateName("") }}
                      className="flex items-center gap-1.5 px-3 h-9 bg-[#2d2e30] border border-[#3c3c3f] hover:border-[#7CFF00]/50 rounded-xl text-[13px] text-[#9aa0a6] font-medium transition-colors whitespace-nowrap"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-[#7CFF00]" />
                      保存模板
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={saveTemplateName}
                        onChange={e => setSaveTemplateName(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === "Escape") setShowSaveInput(false)
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (!saveTemplateName.trim()) return
                            const success = await saveTemplate(saveTemplateName.trim(), { ...formData })
                            if (success) {
                              setShowSaveInput(false)
                              setSaveTemplateName("")
                            }
                          }
                        }}
                        placeholder="模板名称，回车保存"
                        className="w-36 h-9 px-2 bg-[#2d2e30] border border-[#7CFF00]/50 rounded-xl text-[#e3e3e3] text-[13px] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!saveTemplateName.trim()) return
                          const success = await saveTemplate(saveTemplateName.trim(), { ...formData })
                          if (success) {
                            setShowSaveInput(false)
                            setSaveTemplateName("")
                          }
                        }}
                        className="h-9 px-2 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 text-[#7CFF00] font-bold rounded-xl text-[12px] transition-colors"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSaveInput(false)}
                        className="h-9 w-9 flex items-center justify-center text-[#6e6e73] hover:text-[#e3e3e3] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 mx-6 mt-4 rounded-xl bg-[#ee675c]/10 border border-[#ee675c]/30">
                  <div className="text-[#ee675c] mt-0.5">⚠</div>
                  <span className="text-[13px] font-medium text-[#ee675c]">{error}</span>
                </div>
              )}

              {/* 横向两列内容区 */}
              <div className="flex divide-x divide-[#3c3c3f] overflow-y-auto flex-1">
                {/* 左列：名称/分类/描述/图标/价格库存 */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">产品名称</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">所属分类</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                        required
                      >
                        <option value="">选择分类</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">产品描述</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                    />
                  </div>

                  {/* 产品图标 */}
                  <div className="p-4 bg-[#2d2e30] rounded-xl border border-[#3c3c3f]">
                    <div className="flex items-center gap-2 mb-3">
                      <Flag className="w-4 h-4 text-[#7CFF00]" />
                      <label className="text-[13px] font-medium text-[#9aa0a6]">产品图标</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={flagSearchQuery}
                        onChange={(e) => setFlagSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchCountryFlag())}
                        placeholder="搜索国旗，如：美国、+95"
                        className="flex-1 h-9 px-3 bg-[#1e1f20] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[13px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={searchCountryFlag}
                        disabled={isSearchingFlag || !flagSearchQuery.trim()}
                        className="px-3 h-9 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 text-[#7CFF00] font-semibold rounded-lg transition-all duration-200 text-[12px] disabled:bg-[#3c3c3f] disabled:text-[#6e6e73] disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {isSearchingFlag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        搜索
                      </button>
                    </div>
                    {flagResults.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {flagResults.map((result) => (
                          <button
                            key={result.code}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, logo_data: result.flagUrl, icon_url: result.flagUrl })
                              setLogoPreview(result.flagUrl)
                              setFlagResults([])
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 bg-[#1e1f20] hover:bg-[#3c3c3f] border border-[#3c3c3f] rounded-lg transition-all"
                          >
                            <img src={result.flagUrl} alt={result.name} className="w-6 h-4 object-cover rounded" />
                            <span className="text-[11px] text-[#e3e3e3] truncate">{result.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border border-[#3c3c3f]"
                        style={{ backgroundColor: formData.logo_bg_color }}
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo预览" className="w-8 h-8 object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-[#6e6e73]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.logo_data}
                          onChange={(e) => {
                            setFormData({ ...formData, logo_data: e.target.value })
                            setLogoPreview(e.target.value)
                          }}
                          placeholder="或直接粘贴图片URL"
                          className="w-full h-8 px-2 bg-[#1e1f20] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[12px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                        />
                      </div>
                      <input
                        type="color"
                        value={formData.logo_bg_color}
                        onChange={(e) => setFormData({ ...formData, logo_bg_color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                        title="背景色"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">售价</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">成本价</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                        className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">库存</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                        className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">销量</label>
                      <input
                        type="number"
                        value={formData.sales}
                        onChange={(e) => setFormData({ ...formData, sales: parseInt(e.target.value) })}
                        className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 右列：标签/使用说明/开关/发货/按钮 */}
                <div className="w-80 p-6 flex flex-col gap-4 overflow-y-auto">
                  {/* 产品标签 */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                      产品标签 <span className="text-[#6e6e73] font-normal">（右���角）</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.tag_label}
                        onChange={(e) => setFormData({ ...formData, tag_label: e.target.value.toUpperCase() })}
                        className="flex-1 h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors uppercase"
                        placeholder="HOT、NEW..."
                        maxLength={10}
                      />
                      {formData.tag_label && (
                        <div className="px-2.5 py-1 bg-[#ee675c] rounded text-white text-[11px] font-bold shrink-0">
                          {formData.tag_label}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {["HOT", "NEW", "促销", "推荐"].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFormData({ ...formData, tag_label: tag })}
                          className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                            formData.tag_label === tag
                              ? "bg-[#7CFF00]/20 border-[#7CFF00] text-[#7CFF00]"
                              : "bg-[#2d2e30] border-[#3c3c3f] text-[#9aa0a6] hover:border-[#5f6368]"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                      {formData.tag_label && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, tag_label: "" })}
                          className="px-2 py-1 text-[11px] rounded-md bg-[#ee675c]/20 border border-[#ee675c] text-[#ee675c]"
                        >
                          清除
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 使用说明 */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                      使用说明 <span className="text-[#6e6e73] font-normal">（支持HTML）</span>
                    </label>
                    <textarea
                      value={formData.usage_instructions}
                      onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
                      className="flex-1 w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[13px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors resize-none font-mono"
                      placeholder={"使用说明，支持HTML格式\n1. 登录账号\n2. 进入设置"}
                      rows={7}
                    />
                  </div>

                  {/* 上架开关 + 发货类型 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#2d2e30] rounded-xl">
                      <span className="text-[13px] font-medium text-[#e3e3e3]">
                        {formData.is_active ? "已上架" : "已下架"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                          formData.is_active ? "bg-[#7CFF00]" : "bg-[#3c3c3f]"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            formData.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">发货类型</label>
                      <select
                        value={formData.delivery_type}
                        onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                        className="w-full h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[13px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                      >
                        <option value="自动发货">自动发货</option>
                        <option value="人工发货">人工发货</option>
                      </select>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
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
                      className="flex-1 h-11 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 disabled:opacity-50 text-[#7CFF00] font-semibold rounded-xl transition-all duration-200 text-[14px] flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingProduct ? "保存" : "添加"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 库存管理弹窗 - 高级设计 */}
      {inventoryModalOpen && inventoryProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#1e1f20] to-[#151617] rounded-2xl border border-[#3c3c3f]/60 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40">
            {/* 头部 - 带渐变底色 */}
            <div className="relative px-6 py-5 border-b border-[#3c3c3f]/50 shrink-0 bg-gradient-to-r from-[#7CFF00]/5 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#7CFF00]/15 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#7CFF00]" />
                    </div>
                    <h2 className="text-[17px] font-semibold text-[#e3e3e3]">库存管理</h2>
                  </div>
                  <p className="text-[12px] text-[#9aa0a6] pl-10 truncate max-w-md">{inventoryProduct.name}</p>
                </div>
                <button
                  onClick={() => setInventoryModalOpen(false)}
                  className="p-1.5 text-[#6e6e73] hover:text-[#e3e3e3] hover:bg-white/5 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* 统计数据 - 嵌入头部 */}
              <div className="flex items-center gap-6 mt-4 pl-10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#6e6e73] uppercase tracking-wide">当前库存</span>
                  <span className="text-[18px] font-bold text-[#e3e3e3]">{inventoryProduct?.stock || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#6e6e73] uppercase tracking-wide">记录总计</span>
                  <span className="text-[18px] font-bold text-[#e3e3e3]">{inventoryStats.total}</span>
                </div>
                <div className="w-px h-5 bg-[#3c3c3f]" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#7CFF00]" />
                  <span className="text-[18px] font-bold text-[#7CFF00]">{inventoryStats.available}</span>
                  <span className="text-[11px] text-[#6e6e73]">可用</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6e6e73]" />
                  <span className="text-[18px] font-bold text-[#6e6e73]">{inventoryStats.sold}</span>
                  <span className="text-[11px] text-[#6e6e73]">已售</span>
                </div>
              </div>
            </div>

            {/* 库存统计概览 */}
            <div className="px-6 py-3 border-b border-[#3c3c3f]/50 shrink-0 bg-[#0d0e0f]/50">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <span className="text-[11px] text-[#6e6e73] block mb-1">当前库存</span>
                  <span className="text-[16px] font-bold text-[#e3e3e3]">{inventoryProduct?.stock || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-[#6e6e73] block mb-1">可用库存</span>
                  <span className="text-[16px] font-bold text-[#81c995]">{inventoryStats.available || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-[#6e6e73] block mb-1">已售出</span>
                  <span className="text-[16px] font-bold text-[#ee675c]">{inventoryStats.sold || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-[#6e6e73] block mb-1">总记录</span>
                  <span className="text-[16px] font-bold text-[#7CFF00]">{inventoryStats.total || 0}</span>
                </div>
              </div>
            </div>

            {/* 添加库存区域 */}
            <div className="px-6 py-4 border-b border-[#3c3c3f]/50 shrink-0">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <textarea
                    value={newInventoryContent}
                    onChange={(e) => setNewInventoryContent(e.target.value)}
                    placeholder="粘贴库存内容，每行一条..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-[#0d0e0f] border border-[#3c3c3f]/60 rounded-xl text-[#e3e3e3] placeholder-[#4a4a4d] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00]/50 focus:ring-1 focus:ring-[#7CFF00]/20 resize-none transition-all"
                  />
                </div>
                <button
                  onClick={handleAddInventory}
                  disabled={inventoryAdding || !newInventoryContent.trim()}
                  className="h-[60px] px-5 bg-[#7CFF00]/10 text-[#7CFF00] rounded-xl font-semibold text-[13px] hover:bg-[#7CFF00]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
                >
                  {inventoryAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  添加库存
                </button>
              </div>
            </div>

            {/* Tab 筛选 */}
            <div className="flex items-center gap-1 px-6 py-2 border-b border-[#3c3c3f]/50 shrink-0 bg-[#151617]">
              {[
                { key: "all", label: "全部", count: inventoryStats.total },
                { key: "available", label: "可用", count: inventoryStats.available },
                { key: "sold", label: "已售出", count: inventoryStats.sold }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setInventoryFilter(item.key as typeof inventoryFilter)}
                  className={`h-8 flex items-center justify-center px-3 rounded-lg text-[12px] font-medium transition-all ${
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
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
                  <span className="text-[12px] text-[#6e6e73]">加载中...</span>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#2d2e30] flex items-center justify-center">
                    <Package className="w-5 h-5 text-[#4a4a4d]" />
                  </div>
                  <p className="text-[#6e6e73] text-[13px]">暂无库存数据</p>
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
                        {item.status === "available" ? "可用" : "已售"}
                      </span>
                      <span className="text-[10px] text-[#4a4a4d] shrink-0 hidden sm:block">
                        {new Date(item.created_at).toLocaleDateString("zh-CN")}
                      </span>
                      {item.status === "available" && (
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="p-1 text-[#4a4a4d] hover:text-[#ee675c] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
