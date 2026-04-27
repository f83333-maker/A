"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Package, ArrowUp, ArrowDown, Flag, Search, BookmarkPlus, BookOpen, ChevronDown, Clock, CheckCircle } from "lucide-react"
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
  createdAt: string
}

const TEMPLATES_KEY = "product_templates_v1"

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
}

function loadTemplates(): ProductTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]")
  } catch {
    return []
  }
}

function saveTemplates(templates: ProductTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
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
  
  // 国旗搜索状态
  const [flagSearchQuery, setFlagSearchQuery] = useState("")
  const [flagResults, setFlagResults] = useState<{ code: string; flagUrl: string; name: string }[]>([])
  const [isSearchingFlag, setIsSearchingFlag] = useState(false)

  // 库存弹窗状态
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({ available: 0, sold: 0, total: 0 })
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryAdding, setInventoryAdding] = useState(false)
  const [newInventoryContent, setNewInventoryContent] = useState("")
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "available" | "sold">("all")

  useEffect(() => {
    fetchData()
    // 检查URL参数中的分类ID
    const params = new URLSearchParams(window.location.search)
    const categoryId = params.get("categoryId")
    if (categoryId) {
      setFilterCategoryId(categoryId)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ])
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
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
    setTemplates(loadTemplates())
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        cost_price: product.cost_price || 0,
        stock: product.stock,
        sales: product.sales,
        tag_label: product.tags?.[0] || "",
        is_active: product.is_active,
        category_id: product.category_id,
        product_info: product.product_info || "",
        usage_instructions: product.usage_instructions || "",
        logo_data: product.logo_data || "",
        logo_bg_color: product.logo_bg_color || "#2d2e30",
        delivery_type: product.delivery_type || "自动发货",
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

      // 构建提交数据，排除 tag_label（它不是数据库字段）
      const { tag_label, ...restFormData } = formData
      const submitData = {
        ...restFormData,
        tags: tag_label ? [tag_label.trim()] : [],
        is_hot: !!tag_label, // 有标签就算热门
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
    const sortedProducts = [...products].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
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
    const sortedProducts = [...products].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    if (index === sortedProducts.length - 1) return
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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#e3e3e3]">产品管理</h1>
          <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
            管理所有产品，共 {products.length} 个产品
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          添加产品
        </button>
      </div>

      {/* 分类筛选 */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#9aa0a6] font-medium">筛选分类：</span>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="h-9 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[13px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {filterCategoryId && (
          <button
            onClick={() => setFilterCategoryId("")}
            className="text-[12px] text-[#7CFF00] hover:text-[#9FFF40] font-medium"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 产品列表 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3c3c3f]">
                <th className="px-2 py-2.5 text-left text-[12px] font-semibold text-[#9aa0a6]">排序</th>
                <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#9aa0a6]">产品名称</th>
                <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#9aa0a6] hidden md:table-cell">分类</th>
                <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#9aa0a6]">价格</th>
                <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#9aa0a6] hidden lg:table-cell">库存</th>
                <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#9aa0a6]">状态</th>
                <th className="px-3 py-2.5 text-right text-[12px] font-semibold text-[#9aa0a6]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c3c3f]">
              {[...products]
                .filter(p => !filterCategoryId || p.category_id === filterCategoryId)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((product, index) => (
                <tr key={product.id} className="hover:bg-[#2d2e30]/50 transition-colors">
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-0.5 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === products.length - 1}
                        className="p-0.5 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-[13px] font-medium text-[#e3e3e3]">{product.name}</p>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    <span className="text-[12px] text-[#9aa0a6] font-medium">
                      {product.categories?.name || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-[13px] font-semibold text-[#7CFF00]">¥{product.price}</p>
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <span className="text-[13px] font-semibold text-[#e3e3e3]">
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                        product.is_active
                          ? "bg-[#81c995]/10 text-[#81c995]"
                          : "bg-[#6e6e73]/10 text-[#6e6e73]"
                      }`}
                    >
                      {product.is_active ? "上架" : "下架"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openInventoryModal(product)}
                        className="p-1.5 text-[#9aa0a6] hover:text-[#81c995] hover:bg-[#81c995]/10 rounded-lg transition-all"
                        title="管理库存"
                      >
                        <Package className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openModal(product)}
                        className="p-1.5 text-[#9aa0a6] hover:text-[#7CFF00] hover:bg-[#7CFF00]/10 rounded-lg transition-all"
                        title="编辑产品"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-[#9aa0a6] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-all"
                        title="删除产品"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f] sticky top-0 bg-[#1e1f20]">
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* 模板工具栏 - 仅添加模式显示 */}
              {!editingProduct && (
                <div className="flex items-center gap-2">
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
                              <span className="ml-2 text-[11px] text-[#6e6e73]">{new Date(tpl.createdAt).toLocaleDateString("zh-CN")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = templates.filter(t => t.id !== tpl.id)
                                saveTemplates(updated)
                                setTemplates(updated)
                              }}
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
                        onKeyDown={e => {
                          if (e.key === "Escape") setShowSaveInput(false)
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (!saveTemplateName.trim()) return
                            const tpl: ProductTemplate = {
                              id: Date.now().toString(),
                              name: saveTemplateName.trim(),
                              data: { ...formData },
                              createdAt: new Date().toISOString(),
                            }
                            const updated = [tpl, ...templates]
                            saveTemplates(updated)
                            setTemplates(updated)
                            setShowSaveInput(false)
                            setSaveTemplateName("")
                          }
                        }}
                        placeholder="模板名称，回车保存"
                        className="w-36 h-9 px-2 bg-[#2d2e30] border border-[#7CFF00]/50 rounded-xl text-[#e3e3e3] text-[13px] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!saveTemplateName.trim()) return
                          const tpl: ProductTemplate = {
                            id: Date.now().toString(),
                            name: saveTemplateName.trim(),
                            data: { ...formData },
                            createdAt: new Date().toISOString(),
                          }
                          const updated = [tpl, ...templates]
                          saveTemplates(updated)
                          setTemplates(updated)
                          setShowSaveInput(false)
                          setSaveTemplateName("")
                        }}
                        className="h-9 px-2 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-bold rounded-xl text-[12px] transition-colors"
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
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#ee675c]/10 border border-[#ee675c]/30">
                  <div className="text-[#ee675c] mt-0.5">⚠</div>
                  <span className="text-[13px] font-medium text-[#ee675c]">{error}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    产品名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    所属分类
                  </label>
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
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  产品描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                />
              </div>
              {/* 产品图标/国旗搜索 */}
              <div className="p-4 bg-[#2d2e30] rounded-xl border border-[#3c3c3f]">
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="w-4 h-4 text-[#7CFF00]" />
                  <label className="text-[13px] font-medium text-[#9aa0a6]">产品图标</label>
                </div>
                {/* 国旗搜索 */}
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
                    className="px-3 h-9 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg transition-all duration-200 text-[12px] disabled:bg-[#3c3c3f] disabled:text-[#6e6e73] disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isSearchingFlag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    搜索
                  </button>
                </div>
                {/* 国旗搜索结果 */}
                {flagResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {flagResults.map((result) => (
                      <button
                        key={result.code}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, logo_data: result.flagUrl })
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
                {/* Logo预览 */}
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
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    售价
                  </label>
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
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    成本价
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    库存
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    销量
                  </label>
                  <input
                    type="number"
                    value={formData.sales}
                    onChange={(e) => setFormData({ ...formData, sales: parseInt(e.target.value) })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                  />
                </div>
              </div>
              {/* 产品标签 */}
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  产品标签 <span className="text-[#6e6e73]">（显示在产品右上角，如 HOT、NEW）</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.tag_label}
                    onChange={(e) => setFormData({ ...formData, tag_label: e.target.value.toUpperCase() })}
                    className="flex-1 h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors uppercase"
                    placeholder="如：HOT、NEW、促销"
                    maxLength={10}
                  />
                  {formData.tag_label && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ee675c] rounded text-white text-[12px] font-bold">
                      {formData.tag_label}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
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

              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  使用说明 <span className="text-[#6e6e73]">（支持HTML，可插入图片）</span>
                </label>
                <textarea
                  value={formData.usage_instructions}
                  onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors resize-none font-mono"
                  placeholder="使用说明，支持HTML格式。例如：&#10;1. 登录账号&#10;2. 进入设置&#10;&#10;插入图片示例：&#10;<img src=&quot;https://example.com/image.png&quot; alt=&quot;说明图片&quot; />"
                />
                <p className="mt-2 text-[12px] text-[#6e6e73]">
                  提示：可以使用 HTML 标签如 &lt;img&gt;、&lt;a&gt;、&lt;br&gt; 等来丰富说明内容
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      formData.is_active ? "bg-[#7CFF00]" : "bg-[#3c3c3f]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        formData.is_active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-[14px] font-medium text-[#e3e3e3]">
                    {formData.is_active ? "已上架" : "已下架"}
                  </span>
                </label>
              </div>
              
              {/* 发货类型 */}
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-[#e3e3e3]">发货类型</label>
                <select
                  value={formData.delivery_type}
                  onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#7CFF00] transition-colors"
                >
                  <option value="自动发货">自动发货</option>
                  <option value="人工发货">人工发货</option>
                </select>
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
                  {editingProduct ? "保存" : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 库存管理弹窗 */}
      {inventoryModalOpen && inventoryProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f] shrink-0">
              <div>
                <h2 className="text-[18px] font-semibold text-[#e3e3e3]">库存管理</h2>
                <p className="text-[13px] text-[#9aa0a6] mt-0.5">{inventoryProduct.name}</p>
              </div>
              <button
                onClick={() => setInventoryModalOpen(false)}
                className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-[#3c3c3f] shrink-0">
              <div className="bg-[#2d2e30] rounded-xl p-3 text-center">
                <div className="text-[#9aa0a6] text-[11px] mb-0.5">总库存</div>
                <div className="text-xl font-bold text-[#e3e3e3]">{inventoryStats.total}</div>
              </div>
              <div className="bg-[#2d2e30] rounded-xl p-3 text-center">
                <div className="text-[#81c995] text-[11px] mb-0.5">可用</div>
                <div className="text-xl font-bold text-[#81c995]">{inventoryStats.available}</div>
              </div>
              <div className="bg-[#2d2e30] rounded-xl p-3 text-center">
                <div className="text-[#f28b82] text-[11px] mb-0.5">已售出</div>
                <div className="text-xl font-bold text-[#f28b82]">{inventoryStats.sold}</div>
              </div>
            </div>

            {/* 添加库存 */}
            <div className="px-6 py-4 border-b border-[#3c3c3f] shrink-0">
              <p className="text-[12px] text-[#9aa0a6] mb-2">每行一个账号，自动按行分割</p>
              <div className="flex gap-2">
                <textarea
                  value={newInventoryContent}
                  onChange={(e) => setNewInventoryContent(e.target.value)}
                  placeholder="账号1&#10;账号2&#10;账号3"
                  rows={3}
                  className="flex-1 px-3 py-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00] resize-none"
                />
                <button
                  onClick={handleAddInventory}
                  disabled={inventoryAdding || !newInventoryContent.trim()}
                  className="px-4 bg-[#7CFF00] text-[#131314] rounded-xl font-semibold text-[13px] hover:bg-[#9FFF40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {inventoryAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  添加
                </button>
              </div>
            </div>

            {/* 筛选 */}
            <div className="flex gap-2 px-6 py-3 border-b border-[#3c3c3f] shrink-0">
              {[
                { key: "all", label: "全部" },
                { key: "available", label: "可用" },
                { key: "sold", label: "已售出" }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setInventoryFilter(item.key as typeof inventoryFilter)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    inventoryFilter === item.key
                      ? "bg-[#7CFF00] text-[#131314]"
                      : "bg-[#2d2e30] text-[#9aa0a6] hover:bg-[#3c3c3f]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 库存列表 */}
            <div className="flex-1 overflow-y-auto">
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-10 h-10 mx-auto text-[#5f6368] mb-2" />
                  <p className="text-[#9aa0a6] text-[13px]">暂无库存</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#1e1f20]">
                    <tr className="border-b border-[#3c3c3f]">
                      <th className="text-left px-6 py-2.5 text-[#9aa0a6] text-[11px] font-medium">内容</th>
                      <th className="text-left px-3 py-2.5 text-[#9aa0a6] text-[11px] font-medium w-16">状态</th>
                      <th className="text-left px-3 py-2.5 text-[#9aa0a6] text-[11px] font-medium w-32 hidden sm:table-cell">创建时间</th>
                      <th className="text-right px-6 py-2.5 text-[#9aa0a6] text-[11px] font-medium w-12">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b border-[#3c3c3f]/50 hover:bg-[#2d2e30]/50">
                        <td className="px-6 py-2.5">
                          <code className="text-[12px] text-[#e3e3e3] bg-[#2d2e30] px-2 py-0.5 rounded font-mono">
                            {item.content}
                          </code>
                        </td>
                        <td className="px-3 py-2.5">
                          {item.status === "available" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#81c995]/20 text-[#81c995] text-[10px] rounded-full">
                              <Clock className="w-2.5 h-2.5" />
                              可用
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#f28b82]/20 text-[#f28b82] text-[10px] rounded-full">
                              <CheckCircle className="w-2.5 h-2.5" />
                              已售
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[#9aa0a6] text-[11px] hidden sm:table-cell">
                          {new Date(item.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          {item.status === "available" && (
                            <button
                              onClick={() => handleDeleteInventory(item.id)}
                              className="p-1 text-[#f28b82] hover:bg-[#f28b82]/20 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
