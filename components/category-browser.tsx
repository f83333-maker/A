"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { PackageSearch, Loader2, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react"
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
          <mark key={i} className="bg-[#00d26a]/20 text-[#00d26a] rounded-[3px] px-[1px] not-italic">
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
function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className="text-[#ff4d6a] text-[13px] font-medium">售罄</span>
  }
  if (stock <= 10) {
    return (
      <span className="text-[13px]">
        <span className="text-[#ff4d6a] font-medium">{stock}</span>
        <span className="text-[#ff4d6a]/60 text-[11px] ml-0.5">紧张</span>
      </span>
    )
  }
  if (stock <= 50) {
    return (
      <span className="text-[13px]">
        <span className="text-[#ffd700] font-medium">{stock}</span>
        <span className="text-[#ffd700]/60 text-[11px] ml-0.5">一般</span>
      </span>
    )
  }
  return (
    <span className="text-[13px]">
      <span className="text-[#00d26a] font-medium">{stock}</span>
      <span className="text-[#00d26a]/60 text-[11px] ml-0.5">充足</span>
    </span>
  )
}

// 产品Logo组件
function ProductLogo({ product }: { product: Product }) {
  if (product.logo_data) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: product.logo_bg_color || "#1a1a1a" }}
      >
        <img src={product.logo_data} alt={product.name} className="w-6 h-6 object-contain" />
      </div>
    )
  }
  
  // 默认显示产品名首字
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-[#333]">
      <span className="text-[14px] font-bold text-[#8c8c8c]">
        {product.name.charAt(0)}
      </span>
    </div>
  )
}

// 折扣标签
function DiscountBadge({ price, originalPrice }: { price: number; originalPrice: number }) {
  if (!originalPrice || originalPrice <= price) return null
  const discount = Math.round((1 - price / originalPrice) * 100)
  if (discount <= 0) return null
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#00d26a]/20 text-[#00d26a] ml-2">
      -{discount}%
    </span>
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

  const [activeCategoryId, setActiveCategoryId] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  // 初始化
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === "all") {
      // 默认显示全部
    }
  }, [categories, activeCategoryId])

  // 搜索时切换到全部
  useEffect(() => {
    if (searchQuery.trim()) {
      setActiveCategoryId("all")
    }
  }, [searchQuery])

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // 过滤产品
  const filteredProducts = products.filter(p => {
    const matchesSearch = matchesQuery(p, searchQuery)
    const matchesCategory = activeCategoryId === "all" || p.category_id === activeCategoryId
    return matchesSearch && matchesCategory
  })

  // 分类滚动
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // 统计信息
  const totalProducts = filteredProducts.length
  const totalSales = filteredProducts.reduce((sum, p) => sum + (p.sales || 0), 0)
  const hotProducts = filteredProducts.filter(p => p.is_hot).length

  const isLoading = categoriesLoading || productsLoading

  if (isLoading) {
    return (
      <section className="py-8 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d26a]" />
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="py-8 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center min-h-[400px] gap-3">
          <PackageSearch className="w-10 h-10 text-[#333333]" />
          <p className="text-[14px] text-[#595959]">暂无分类数据</p>
        </div>
      </section>
    )
  }

  return (
    <section id="category-browser" className="py-6 md:py-8 bg-[#000000]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* ── 顶部分类标签栏 ── */}
        <div className="relative mb-6">
          {/* 左箭头 */}
          <button
            onClick={() => scrollCategories('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[#000000] border border-[#333] rounded-full text-[#8c8c8c] hover:text-white hover:border-[#555] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 分类标签 */}
          <div
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide mx-10 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* 全部标签 */}
            <button
              onClick={() => setActiveCategoryId("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 border ${
                activeCategoryId === "all"
                  ? "bg-[#1a1a1a] border-[#00d26a] text-white"
                  : "bg-transparent border-[#333] text-[#8c8c8c] hover:border-[#555] hover:text-white"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00d26a] to-[#00a855] flex items-center justify-center text-[10px] text-white font-bold">
                ALL
              </span>
              全部
            </button>

            {categories.map((cat) => {
              const isActive = cat.id === activeCategoryId
              const catProductCount = products.filter(p => p.category_id === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? "bg-[#1a1a1a] border-[#00d26a] text-white"
                      : "bg-transparent border-[#333] text-[#8c8c8c] hover:border-[#555] hover:text-white"
                  }`}
                >
                  {cat.logo_data ? (
                    <img src={cat.logo_data} alt={cat.name} className="w-5 h-5 rounded-full object-contain" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px]">
                      {cat.icon || cat.name.charAt(0)}
                    </span>
                  )}
                  {cat.name}
                  <span className="text-[11px] text-[#595959]">{catProductCount}</span>
                </button>
              )
            })}
          </div>

          {/* 右箭头 */}
          <button
            onClick={() => scrollCategories('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[#000000] border border-[#333] rounded-full text-[#8c8c8c] hover:text-white hover:border-[#555] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── 统计信息栏 ── */}
        <div className="flex items-center gap-4 mb-4 text-[13px] flex-wrap">
          <span className="text-[#8c8c8c]">
            已收录 <span className="text-white font-medium">{totalProducts}</span> 个商品
          </span>
          <span className="text-[#333]">|</span>
          <span className="text-[#8c8c8c]">
            总销量 <span className="text-[#00d26a] font-medium">{totalSales.toLocaleString()}</span>
          </span>
          {hotProducts > 0 && (
            <>
              <span className="text-[#333]">|</span>
              <span className="text-[#8c8c8c]">
                热销 <span className="text-[#ff4d6a] font-medium">{hotProducts}</span>
              </span>
            </>
          )}
        </div>

        {/* ── 产品表格 ── */}
        <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
          {/* 表头 */}
          <div className="hidden md:grid grid-cols-[40px_40px_1fr_100px_100px_100px_80px_100px] gap-4 px-4 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a] text-[12px] text-[#595959] font-medium">
            <span>排名</span>
            <span></span>
            <span>商品名称</span>
            <span className="text-right">单价</span>
            <span className="text-center">库存</span>
            <span className="text-center">销量</span>
            <span className="text-center">状态</span>
            <span className="text-center">操作</span>
          </div>

          {/* 产品列表 */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <PackageSearch className="w-10 h-10 text-[#333333]" />
              <p className="text-[14px] text-[#595959]">暂无匹配的商品</p>
            </div>
          ) : (
            <div>
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="group border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0a0a0a] transition-colors"
                >
                  {/* 桌面端 */}
                  <div className="hidden md:grid grid-cols-[40px_40px_1fr_100px_100px_100px_80px_100px] gap-4 items-center px-4 py-3">
                    {/* 排名 */}
                    <div className="flex items-center justify-center">
                      {index < 3 ? (
                        <span className={`text-[14px] font-bold ${
                          index === 0 ? "text-[#ffd700]" : 
                          index === 1 ? "text-[#c0c0c0]" : 
                          "text-[#cd7f32]"
                        }`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#595959]">{index + 1}</span>
                      )}
                    </div>

                    {/* 收藏 */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="flex items-center justify-center"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          favorites.has(product.id)
                            ? "text-[#ffd700] fill-[#ffd700]"
                            : "text-[#333] hover:text-[#595959]"
                        }`}
                      />
                    </button>

                    {/* 商品信息 */}
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductLogo product={product} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-white font-medium truncate">
                            <Highlight text={product.name} query={searchQuery} />
                          </span>
                          {product.is_hot && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#ff4d6a]/20 text-[#ff4d6a]">
                              HOT
                            </span>
                          )}
                          <DiscountBadge price={product.price} originalPrice={product.original_price} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#595959] truncate">
                            {product.categories?.name || "未分类"}
                          </span>
                          {product.tags && product.tags.length > 0 && (
                            <span className="text-[10px] text-[#00d26a]/60">
                              {product.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 单价 */}
                    <div className="text-right">
                      <span className="text-[15px] font-bold text-[#ffd700]">¥{product.price}</span>
                      {product.original_price > product.price && (
                        <div className="text-[11px] text-[#595959] line-through">
                          ¥{product.original_price}
                        </div>
                      )}
                    </div>

                    {/* 库存 */}
                    <div className="text-center">
                      <StockStatus stock={product.stock} />
                    </div>

                    {/* 销量 */}
                    <div className="text-center">
                      <span className="text-[13px] text-[#8c8c8c]">
                        {(product.sales || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* 状态 */}
                    <div className="text-center">
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d26a] animate-pulse" />
                          <span className="text-[11px] text-[#00d26a]">在售</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d6a]" />
                          <span className="text-[11px] text-[#ff4d6a]">售罄</span>
                        </span>
                      )}
                    </div>

                    {/* 操作 */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => handlePurchase(product)}
                        disabled={product.stock <= 0}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 ${
                          product.stock > 0
                            ? "bg-[#00d26a] hover:bg-[#00e676] text-black"
                            : "bg-[#333] text-[#595959] cursor-not-allowed"
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        买入
                      </button>
                    </div>
                  </div>

                  {/* 移动端 */}
                  <div className="md:hidden flex items-center gap-3 px-3 py-3">
                    {/* 排名 */}
                    <div className="w-6 text-center shrink-0">
                      {index < 3 ? (
                        <span className={`text-[12px] font-bold ${
                          index === 0 ? "text-[#ffd700]" : 
                          index === 1 ? "text-[#c0c0c0]" : 
                          "text-[#cd7f32]"
                        }`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#595959]">{index + 1}</span>
                      )}
                    </div>

                    {/* Logo */}
                    <ProductLogo product={product} />

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-white font-medium truncate">
                          <Highlight text={product.name} query={searchQuery} />
                        </span>
                        {product.is_hot && (
                          <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-[#ff4d6a]/20 text-[#ff4d6a]">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[13px] font-bold text-[#ffd700]">¥{product.price}</span>
                        <StockStatus stock={product.stock} />
                        <span className="text-[11px] text-[#595959]">售{product.sales || 0}</span>
                      </div>
                    </div>

                    {/* 购买按钮 */}
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={product.stock <= 0}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        product.stock > 0
                          ? "bg-[#00d26a] hover:bg-[#00e676] text-black"
                          : "bg-[#333] text-[#595959] cursor-not-allowed"
                      }`}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      买入
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        {filteredProducts.length > 0 && (
          <div className="mt-4 text-center text-[12px] text-[#595959]">
            共 {filteredProducts.length} 个商品 · 数据实时更新
          </div>
        )}
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
                tags: selectedProduct.tags || [],
                category: selectedProduct.categories?.name || "",
              }
            : null
        }
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduct(null)
        }}
      />
    </section>
  )
}
