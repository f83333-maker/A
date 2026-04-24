"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { ShoppingCart, Star, PackageSearch, ChevronRight, Loader2 } from "lucide-react"
import { PurchaseModal } from "./purchase-modal"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  icon: string
  color: string
  description: string
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
  return [
    p.name,
    p.description,
    p.tags?.join(" ") || "",
    String(p.price),
    String(p.sales),
    String(p.stock),
  ].some((f) => f.toLowerCase().includes(lower))
}

// ── 组件 ──────────────────────────────────────────────────────────────────────

interface CategoryBrowserProps {
  searchQuery: string
}

export function CategoryBrowser({ searchQuery }: CategoryBrowserProps) {
  const { data: categories = [], isLoading: categoriesLoading } = useSWR<Category[]>(
    "/api/categories",
    fetcher
  )
  const { data: products = [], isLoading: productsLoading } = useSWR<Product[]>(
    "/api/products",
    fetcher
  )

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 当分类加载完成时，设置默认分类
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  // 搜索时自动切换到有结果的分类
  useEffect(() => {
    if (!searchQuery.trim() || categories.length === 0) return
    const firstMatch = categories.find((cat) =>
      products.some((p) => p.category_id === cat.id && matchesQuery(p, searchQuery))
    )
    if (firstMatch) setActiveCategoryId(firstMatch.id)
  }, [searchQuery, categories, products])

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  const visibleProducts = products.filter(
    (p) => p.category_id === activeCategoryId && matchesQuery(p, searchQuery)
  )

  // 左侧分类是否有搜索结果（用于标记高亮）
  function categoryHasMatch(catId: string) {
    if (!searchQuery.trim()) return true
    return products.some((p) => p.category_id === catId && matchesQuery(p, searchQuery))
  }

  const isLoading = categoriesLoading || productsLoading

  if (isLoading) {
    return (
      <section id="category-browser" className="py-16 md:py-20 bg-[#131314]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section id="category-browser" className="py-16 md:py-20 bg-[#131314]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[400px] gap-3">
          <PackageSearch className="w-10 h-10 text-[#3c3c3f]" />
          <p className="text-[14px] font-semibold text-[#6e6e73]">暂无分类数据</p>
        </div>
      </section>
    )
  }

  return (
    <section id="category-browser" className="py-16 md:py-20 bg-[#131314]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* 区块标题 */}
        <div className="mb-5">
          <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#e3e3e3] tracking-[-0.01em]">
            全部分类
          </h2>
          <p className="mt-1 text-[14px] text-[#9aa0a6] font-medium">
            选择左侧分类浏览对应产品
          </p>
        </div>

        {/* 主体：左侧分类 + 右侧产品 */}
        <div className="flex gap-4 min-h-[500px]">

          {/* ── 左侧一级分类 ── */}
          <div className="w-44 shrink-0 flex flex-col gap-1">
            {categories.map((cat) => {
              const isActive = cat.id === activeCategoryId
              const hasMatch = categoryHasMatch(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-[#2d2e30] border border-[#3c3c3f]"
                      : "hover:bg-[#1e1f20] border border-transparent"
                  } ${!hasMatch && searchQuery ? "opacity-40" : "opacity-100"}`}
                >
                  {/* 激活指示线 */}
                  {isActive && activeCategory && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                      style={{ backgroundColor: activeCategory.color }}
                    />
                  )}

                  <span className="text-[20px] leading-none">{cat.icon}</span>

                  <span
                    className={`text-[13px] font-semibold truncate transition-colors ${
                      isActive ? "text-[#e3e3e3]" : "text-[#9aa0a6] group-hover:text-[#e3e3e3]"
                    }`}
                  >
                    {cat.name}
                  </span>

                  {isActive && (
                    <ChevronRight className="ml-auto w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── 右侧产品列表 ── */}
          <div className="flex-1 min-w-0">
            {/* 分类头 */}
            {activeCategory && (
              <div
                className="flex items-center gap-3 mb-6 pb-5 border-b border-[#3c3c3f]/40"
              >
                <span className="text-[28px]">{activeCategory.icon}</span>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#e3e3e3]">
                    {activeCategory.name}
                  </h3>
                  <p className="text-[13px] font-medium" style={{ color: activeCategory.color }}>
                    {visibleProducts.length} 件商品
                    {searchQuery && " · 搜索结果"}
                  </p>
                </div>
              </div>
            )}

            {/* 产品网格 */}
            {visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
                <PackageSearch className="w-10 h-10 text-[#3c3c3f]" />
                <p className="text-[14px] font-semibold text-[#6e6e73]">该分类下暂无匹配产品</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleProducts.map((product, index) => {
                  const categoryIcon = product.categories?.icon || activeCategory?.icon || "📦"
                  const tagColor = product.is_hot ? "#ee675c" : "#8ab4f8"
                  const tag = product.is_hot ? "热销" : (product.tags?.[0] || "推荐")
                  
                  return (
                    <div
                      key={product.id}
                      id={`product-${product.id}`}
                      className="group relative bg-[#1e1f20] rounded-2xl border border-[#3c3c3f]/50 overflow-hidden hover:border-[#5f6368]/60 hover:bg-[#232425] transition-all duration-300 animate-fade-in-up scroll-mt-24"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      {/* 标签 */}
                      <div
                        className="absolute top-3.5 left-3.5 z-10 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${tagColor}18`,
                          color: tagColor,
                        }}
                      >
                        <Highlight text={tag} query={searchQuery} />
                      </div>

                      <div className="p-4">
                        {/* 产品图区 - 使用数据库中的logo_data和背景色 */}
                        <div 
                          className="w-full h-24 mb-4 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden"
                          style={{ backgroundColor: product.logo_data ? (product.logo_bg_color || '#2d2e30') : '#2d2e30' }}
                        >
                          {product.logo_data ? (
                            <img 
                              src={product.logo_data}
                              alt={product.name}
                              className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.style.backgroundColor = '#2d2e30'
                                  parent.innerHTML = `<span class="text-[38px]">${categoryIcon}</span>`
                                }
                              }}
                            />
                          ) : (
                            <span className="text-[38px] transition-transform duration-300 group-hover:scale-110">
                              {categoryIcon}
                            </span>
                          )}
                        </div>

                        {/* 名称 & 描述 */}
                        <h3 className="text-[14px] font-semibold text-[#e3e3e3] mb-1 group-hover:text-white transition-colors leading-snug">
                          <Highlight text={product.name} query={searchQuery} />
                        </h3>
                        <p className="text-[12px] text-[#6e6e73] mb-3 line-clamp-1 font-medium">
                          <Highlight text={product.description || ""} query={searchQuery} />
                        </p>

                        {/* 评分 & 销量 */}
                        <div className="flex items-center gap-3 mb-3 text-[12px]">
                          <div className="flex items-center gap-1 text-[#fdd663]">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-medium">4.9</span>
                          </div>
                          <span className="text-[#6e6e73]">
                            已售 <Highlight text={product.sales?.toLocaleString() || "0"} query={searchQuery} />
                          </span>
                        </div>

                        {/* 价格 & 购买 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[18px] font-semibold text-[#8ab4f8]">
                              ¥<Highlight text={String(product.price)} query={searchQuery} />
                            </span>
                            {product.original_price > 0 && (
                              <span className="text-[12px] text-[#6e6e73] line-through">
                                ¥{product.original_price}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handlePurchase(product)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#2d2e30] hover:bg-[#8ab4f8] text-[#e3e3e3] hover:text-[#131314] rounded-lg transition-all duration-200 text-[12px] font-semibold"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            购买
                          </button>
                        </div>

                        {/* 库存 */}
                        <div className="mt-3 pt-3 border-t border-[#3c3c3f]/40 flex justify-between text-[11px] font-medium">
                          <span className="text-[#6e6e73]">
                            库存 <Highlight text={String(product.stock || 0)} query={searchQuery} />
                          </span>
                          <span className="text-[#81c995]">即时发货</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 购买弹窗 */}
      <PurchaseModal
        product={selectedProduct ? {
          id: selectedProduct.id as unknown as number,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: selectedProduct.price,
          originalPrice: selectedProduct.original_price,
          sales: selectedProduct.sales,
          stock: selectedProduct.stock,
          rating: 4.9,
          tag: selectedProduct.is_hot ? "热销" : (selectedProduct.tags?.[0] || "推荐"),
          tagColor: selectedProduct.is_hot ? "#ee675c" : "#8ab4f8",
          categoryId: selectedProduct.category_id,
        } : null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  )
}
