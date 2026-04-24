"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Package } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
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
  categories: { name: string } | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    original_price: 0,
    cost_price: 0,
    stock: 0,
    sales: 0,
    tags: "",
    is_hot: false,
    is_active: true,
    category_id: "",
    product_info: "",
    usage_instructions: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
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

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        original_price: product.original_price || 0,
        cost_price: product.cost_price || 0,
        stock: product.stock,
        sales: product.sales,
        tags: product.tags?.join(", ") || "",
        is_hot: product.is_hot,
        is_active: product.is_active,
        category_id: product.category_id,
        product_info: product.product_info || "",
        usage_instructions: product.usage_instructions || "",
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        description: "",
        price: 0,
        original_price: 0,
        cost_price: 0,
        stock: 0,
        sales: 0,
        tags: "",
        is_hot: false,
        is_active: true,
        category_id: categories[0]?.id || "",
        product_info: "",
        usage_instructions: "",
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products"
      const method = editingProduct ? "PUT" : "POST"

      const submitData = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to save product:", error)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          添加产品
        </button>
      </div>

      {/* 产品列表 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3c3c3f]">
                <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">产品名称</th>
                <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6] hidden md:table-cell">分类</th>
                <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">价格</th>
                <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6] hidden lg:table-cell">库存</th>
                <th className="px-5 py-4 text-left text-[13px] font-semibold text-[#9aa0a6]">状态</th>
                <th className="px-5 py-4 text-right text-[13px] font-semibold text-[#9aa0a6]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c3c3f]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#2d2e30]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-[14px] font-medium text-[#e3e3e3]">{product.name}</p>
                      <p className="text-[12px] text-[#6e6e73] font-medium truncate max-w-[200px]">
                        {product.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-[13px] text-[#9aa0a6] font-medium">
                      {product.categories?.name || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[14px] font-semibold text-[#8ab4f8]">¥{product.price}</p>
                    {product.original_price > 0 && (
                      <p className="text-[12px] text-[#6e6e73] line-through">¥{product.original_price}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-[13px] text-[#9aa0a6] font-medium">{product.stock}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.is_hot && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#ee675c]/10 text-[#ee675c]">
                          热门
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                        product.is_active 
                          ? "bg-[#81c995]/10 text-[#81c995]" 
                          : "bg-[#6e6e73]/10 text-[#6e6e73]"
                      }`}>
                        {product.is_active ? "上架" : "下架"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/inventory?productId=${product.id}&name=${encodeURIComponent(product.name)}`}
                        className="p-2 text-[#9aa0a6] hover:text-[#81c995] hover:bg-[#81c995]/10 rounded-lg transition-all"
                        title="管理库存"
                      >
                        <Package className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 text-[#9aa0a6] hover:text-[#8ab4f8] hover:bg-[#8ab4f8]/10 rounded-lg transition-all"
                        title="编辑产品"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-[#9aa0a6] hover:text-[#ee675c] hover:bg-[#ee675c]/10 rounded-lg transition-all"
                        title="删除产品"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    产品名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
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
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
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
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    售价
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
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
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    原价
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) })}
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
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
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
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
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  placeholder="如：热销, 推荐, 限时"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  商品介绍
                </label>
                <textarea
                  value={formData.product_info}
                  onChange={(e) => setFormData({ ...formData, product_info: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors resize-none"
                  placeholder="商品详细介绍..."
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  使用说明 <span className="text-[#6e6e73]">（支持HTML，可插入图片）</span>
                </label>
                <textarea
                  value={formData.usage_instructions}
                  onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] text-[14px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors resize-none font-mono"
                  placeholder="使用说明，支持HTML格式。例如：&#10;1. 登录账号&#10;2. 进入设置&#10;&#10;插入图片示例：&#10;<img src=&quot;https://example.com/image.png&quot; alt=&quot;说明图片&quot; />"
                />
                <p className="mt-2 text-[12px] text-[#6e6e73]">
                  提示：可以使用 HTML 标签如 &lt;img&gt;、&lt;a&gt;、&lt;br&gt; 等来丰富说明内容
                </p>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_hot}
                    onChange={(e) => setFormData({ ...formData, is_hot: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#e3e3e3]">热门产品</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#e3e3e3]">上架产品</span>
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
                  className="flex-1 h-11 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:opacity-50 text-[#131314] font-semibold rounded-xl transition-all duration-200 text-[14px] flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? "保存" : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
