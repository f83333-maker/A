"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { PackageSearch, Loader2, ShoppingCart } from "lucide-react"
import { PurchaseModal } from "./purchase-modal"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  icon: string
  color: string
  description: string
  logo_url: string | null
  logo_data: string | null
  logo_bg_color: string | null
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price: number
  stock: number
  sales: number
  tags: string[]
  is_hot: boolean
  category_id: string
  logo_url: string | null
  logo_data: string | null
  logo_bg_color: string | null
  categories: {
    name: string
    icon: string
    color: string
  } | null
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#8ab4f8]/25 text-[#8ab4f8] rounded-[3px] px-[1px] not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function matchesQuery(p: Product, q: string) {
  if (!q.trim()) return true
  const lower = q.toLowerCase()
  return [p.name, p.description, p.tags?.join(" ") || "", String(p.price)].some((f) =>
    f.toLowerCase().includes(lower)
  )
}

// 库存状态显示
function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className="text-[#ee675c] text-[12px] font-medium">售罄</span>
  }
  if (stock < 50) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#fdd663] inline-block" />
        <span className="text-[#fdd663] text-[12px] font-medium">库存紧张</span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[#81c995] inline-block" />
      <span className="text-[#9aa0a6] text-[12px]">{stock.toLocaleString()}</span>
    </span>
  )
}

// 分类图标组件（支持logo图片）
function CategoryLogo({
  category,
  size = "md",
}: {
  category: Category
  size?: "sm" | "md" | "lg"
}) {
  const sizeMap = {
    sm: { box: "w-8 h-8", img: "w-5 h-5" },
    md: { box: "w-9 h-9", img: "w-6 h-6" },
    lg: { box: "w-10 h-10", img: "w-7 h-7" },
  }
  const s = sizeMap[size]
  
  // 有logo_data时显示logo图片
  if (category.logo_data) {
    return (
      <div
        className={`${s.box} rounded-xl flex items-center justify-center shrink-0 overflow-hidden`}
        style={{ backgroundColor: category.logo_bg_color || "#2d2e30" }}
      >
        <img src={category.logo_data} alt={category.name} className={`${s.img} object-contain`} />
      </div>
    )
  }
  
  // 没有logo_data时显示空白占位符（不显示emoji）
  return (
    <div
      className={`${s.box} rounded-xl flex items-center justify-center shrink-0 bg-[#2d2e30]`}
    />
  )
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

interface CategoryBrowserProps {
  searchQuery: string
}

export function CategoryBrowser({ searchQuery }: CategoryBrowserProps) {
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR<Category[]>("/api/categories", fetcher)
  const { data: productsData, isLoading: productsLoading } = useSWR<Product[]>("/api/products", fetcher)

  const categories = categoriesData || []
  const products = productsData || []

  const [activeCategoryId, setActiveCategoryId] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  useEffect(() => {
    if (!searchQuery.trim() || categories.length === 0) return
    const firstMatch = categories.find((cat) =>
      products.some((p) => p.category_id === cat.id && matchesQuery(p, searchQuery))
    )
    if (firstMatch) setActiveCategoryId(firstMatch.id)
  }, [searchQuery, categories, products])

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  function categoryHasMatch(catId: string) {
    if (!searchQuery.trim()) return true
    return products.some((p) => p.category_id === catId && matchesQuery(p, searchQuery))
  }

  const activeCategory = categories.find((c) => c.id === activeCategoryId)
  const visibleProducts = products.filter(
    (p) => p.category_id === activeCategoryId && matchesQuery(p, searchQuery)
  )

  const isLoading = categoriesLoading || productsLoading

  if (isLoading) {
    return (
      <section className="py-12 bg-[#131314]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="py-12 bg-[#131314]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center min-h-[400px] gap-3">
          <PackageSearch className="w-10 h-10 text-[#3c3c3f]" />
          <p className="text-[14px] text-[#6e6e73]">暂无分类数据</p>
        </div>
      </section>
    )
  }

  return (
    <section id="category-browser" className="py-8 md:py-12 bg-[#131314]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex gap-3 md:gap-4 min-h-[500px]">

          {/* ── 左侧分类导航 ── */}
          <div
            ref={sidebarRef}
            className="w-[72px] sm:w-[100px] md:w-[140px] shrink-0 flex flex-col gap-1 self-start sticky top-4"
          >
            <p className="text-[11px] text-[#6e6e73] font-medium px-1 mb-2 hidden md:block">所有分类</p>
            {categories.map((cat) => {
              const isActive = cat.id === activeCategoryId
              const hasMatch = categoryHasMatch(cat.id)
              const catProducts = products.filter((p) => p.category_id === cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`group flex flex-col md:flex-row items-center md:items-start gap-1.5 md:gap-2.5 px-2 md:px-3 py-2.5 rounded-xl text-left transition-all duration-200 w-full ${
                    isActive
                      ? "bg-[#1e1f20] border border-[#3c3c3f]"
                      : "hover:bg-[#1a1b1c] border border-transparent"
                  } ${!hasMatch && searchQuery ? "opacity-40" : "opacity-100"}`}
                >
                  {/* 分类logo */}
                  <CategoryLogo category={cat} size="sm" />

                  {/* 分类名称 + 产品数（中大屏显示） */}
                  <div className="hidden md:flex flex-col min-w-0">
                    <span
                      className={`text-[12px] font-semibold leading-tight truncate transition-colors ${
                        isActive ? "text-[#e3e3e3]" : "text-[#9aa0a6] group-hover:text-[#e3e3e3]"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-[#6e6e73] mt-0.5">
                      {catProducts.length} 个产品
                    </span>
                  </div>

                  {/* 小屏显示名称 */}
                  <span
                    className={`block md:hidden text-[10px] font-medium text-center leading-tight line-clamp-2 transition-colors ${
                      isActive ? "text-[#e3e3e3]" : "text-[#6e6e73] group-hover:text-[#9aa0a6]"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── 右侧产品区域 ── */}
          <div className="flex-1 min-w-0">

            {/* 右侧顶部：分类名 + 产品数量（粘性定位） */}
            {activeCategory && (
              <div className="sticky top-0 z-10 flex items-center justify-between mb-4 pb-3 border-b-2 bg-[#0f0f10]" style={{ borderColor: activeCategory.color }}>
                <div className="flex items-center gap-2.5">
                  <CategoryLogo category={activeCategory} size="md" />
                  <h2 className="text-[16px] sm:text-[18px] font-bold text-[#e3e3e3] truncate">
                    {activeCategory.name}
                  </h2>
                </div>
                <span className="text-[12px] sm:text-[13px] text-[#9aa0a6] shrink-0 ml-2">
                  {visibleProducts.length} 个产品{searchQuery && " · 搜索结果"}
                </span>
              </div>
            )}

            {/* 产品列表 */}
            {visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <PackageSearch className="w-10 h-10 text-[#3c3c3f]" />
                <p className="text-[14px] text-[#6e6e73]">该分类下暂无匹配产品</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-[#2d2e30]">

                {/* 表头（仅中大屏显示） */}
                <div className="hidden sm:grid grid-cols-[1fr_80px_90px_70px_88px] gap-2 px-4 py-2.5 bg-[#1a1b1c] border-b border-[#2d2e30]">
                  <span className="text-[12px] text-[#6e6e73] font-medium">商品名称</span>
                  <span className="text-[12px] text-[#6e6e73] font-medium text-center">单价</span>
                  <span className="text-[12px] text-[#6e6e73] font-medium text-center">库存</span>
                  <span className="text-[12px] text-[#6e6e73] font-medium text-center">已售</span>
                  <span className="text-[12px] text-[#6e6e73] font-medium text-center">操作</span>
                </div>

                {/* 产品行 */}
                {visibleProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`group transition-colors duration-150 hover:bg-[#1e1f20] ${
                      index !== visibleProducts.length - 1 ? "border-b border-[#2d2e30]" : ""
                    }`}
                  >
                    {/* 中大屏：单行表格布局 */}
                    <div className="hidden sm:grid grid-cols-[1fr_80px_90px_70px_88px] gap-2 items-center px-4 py-2">
                      {/* 商品名称 */}
                      <div className="flex items-center min-w-0">
                        <span className="text-[13px] text-[#e3e3e3] font-medium leading-snug truncate">
                          <Highlight text={product.name} query={searchQuery} />
                        </span>
                      </div>

                      {/* 单价 */}
                      <div className="text-center">
                        <span className="text-[14px] font-bold text-[#fb8c00]">
                          ¥{product.price}
                        </span>
                      </div>

                      {/* 库存 */}
                      <div className="flex justify-center">
                        <StockBadge stock={product.stock} />
                      </div>

                      {/* 已售 */}
                      <div className="text-center">
                        <span className="text-[12px] text-[#9aa0a6]">
                          {product.sales?.toLocaleString() || 0}
                        </span>
                      </div>

                      {/* 购买按钮 */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => handlePurchase(product)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 bg-[#81c995] hover:bg-[#6dbb82] text-[#131314] whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          立即购买
                        </button>
                      </div>
                    </div>

                    {/* 小屏：紧凑卡片布局 */}
                    <div className="flex sm:hidden items-center gap-2 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#e3e3e3] font-medium leading-snug line-clamp-2 mb-1">
                          <Highlight text={product.name} query={searchQuery} />
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-[#fb8c00]">¥{product.price}</span>
                          <StockBadge stock={product.stock} />
                          <span className="text-[11px] text-[#6e6e73]">售出{product.sales || 0}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePurchase(product)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#81c995] hover:bg-[#6dbb82] text-[#131314] transition-colors"
                      >
                        购买
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 购买弹窗 */}
      <PurchaseModal
        product={
          selectedProduct
            ? {
                id: selectedProduct.id as unknown as number,
                name: selectedProduct.name,
                description: selectedProduct.description,
                price: selectedProduct.price,
                originalPrice: selectedProduct.original_price,
                sales: selectedProduct.sales,
                stock: selectedProduct.stock,
                rating: 4.9,
                tag: selectedProduct.is_hot ? "热销" : selectedProduct.tags?.[0] || "推荐",
                tagColor: selectedProduct.is_hot ? "#ee675c" : "#8ab4f8",
                categoryId: selectedProduct.category_id,
              }
            : null
        }
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  )
}
