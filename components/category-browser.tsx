"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { PackageSearch, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
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
  icon_url: string | null
  delivery_type: string | null
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
          <mark key={i} className="bg-[#7CFF00]/20 text-[#7CFF00] rounded-[3px] px-[1px] not-italic">
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

// 库存状态显示 - OKX 风格
function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className="text-[#FF3B3B] text-[12px] font-medium">售罄</span>
  }
  if (stock < 10) {
    return <span className="text-[#FF3B3B] text-[12px] font-medium">库存紧张</span>
  }
  if (stock < 30) {
    return <span className="text-[#F7931A] text-[12px] font-medium">库存一般</span>
  }
  return <span className="text-[#7CFF00] text-[12px] font-medium">库存充足</span>
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
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  // 初始化：默认选中第一个分类
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === "all") {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  // 搜索时在当前分类内搜索

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }



  // 过滤产品
  const filteredProducts = products.filter(p => {
    const matchesSearch = matchesQuery(p, searchQuery)
    const matchesCategory = p.category_id === activeCategoryId
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

  const isLoading = categoriesLoading || productsLoading

  if (isLoading) {
    return (
      <section className="py-8 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="py-8 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center min-h-[400px] gap-3">
          <PackageSearch className="w-10 h-10 text-[#2A2A2A]" />
          <p className="text-[14px] text-[#525252]">暂无分类数据</p>
        </div>
      </section>
    )
  }

  return (
    <section id="category-browser" className="py-6 md:py-8 bg-[#000000] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* ── 顶部分类标签栏（两行网格） ── */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => {
                const isActive = cat.id === activeCategoryId
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? "bg-[#7CFF00]/15 border-[#7CFF00] text-[#7CFF00] shadow-[0_0_12px_rgba(124,255,0,0.3)]"
                        : "bg-transparent border-[#2A2A2A] text-[#8a8a8a] hover:border-[#404040] hover:text-white"
                    }`}
                  >
                    {cat.logo_data ? (
                      <img src={cat.logo_data} alt={cat.name} className="w-5 h-5 rounded-full object-contain" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[11px]">
                        {cat.icon || cat.name.charAt(0)}
                      </span>
                    )}
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>



        {/* ── 产品表格 ── */}
        <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
          {/* 表头 */}
          <div className="hidden md:grid grid-cols-[1fr_90px_100px_100px_80px] gap-4 px-4 py-2 bg-[#0D0D0D] border-b border-[#2A2A2A] text-[13px] text-[#737373] font-medium">
            <span>商品名称</span>
            <span className="text-center">发货方式</span>
            <span className="text-right">单价</span>
            <span className="text-center">库存</span>
            <span className="text-center">操作</span>
          </div>

          {/* 产品列表 */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <PackageSearch className="w-10 h-10 text-[#2A2A2A]" />
              <p className="text-[14px] text-[#525252]">暂无匹配的商品</p>
            </div>
          ) : (
            <div>
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="group border-b border-[#2A2A2A] last:border-b-0 hover:bg-[#121212] transition-colors"
                >
                  {/* 桌面端 */}
                  <div className="hidden md:grid grid-cols-[1fr_90px_100px_100px_80px] gap-4 items-center px-4 py-1.5">
                    {/* 商品信息 */}
                    <div className="flex items-center gap-2 min-w-0">
                      {/* 国旗图标 */}
                      {product.icon_url && (
                        <img 
                          src={product.icon_url} 
                          alt="" 
                          className="w-6 h-4 object-cover rounded-sm shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-white font-medium truncate">
                            <Highlight text={product.name} query={searchQuery} />
                          </span>
                          {product.is_hot && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#FF3B3B]/20 text-[#FF3B3B]">
                              HOT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 发货类型 */}
                    <div className="text-center">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                        product.delivery_type === "自动发货" 
                          ? "bg-[#7CFF00]/15 text-[#7CFF00]" 
                          : "bg-[#F7931A]/15 text-[#F7931A]"
                      }`}>
                        {product.delivery_type || "自动发货"}
                      </span>
                    </div>

                    {/* 单价 */}
                    <div className="text-right">
                      <span className="text-[14px] font-bold text-white">¥{product.price}</span>
                    </div>

                    {/* 库存 */}
                    <div className="text-center">
                      <StockStatus stock={product.stock} />
                    </div>

                    {/* 操作 */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => handlePurchase(product)}
                        disabled={product.stock <= 0}
                        className={`px-4 py-1.5 rounded text-[12px] font-semibold transition-all duration-200 ${
                          product.stock > 0
                            ? "bg-[#7CFF00] hover:bg-[#9FFF40] text-black"
                            : "bg-[#2A2A2A] text-[#525252] cursor-not-allowed"
                        }`}
                      >
                        购买
                      </button>
                    </div>
                  </div>

                  {/* 移动端 */}
                  <div className="md:hidden flex items-center gap-2 px-3 py-1.5">
                    {/* 国旗图标 */}
                    {product.icon_url && (
                      <img 
                        src={product.icon_url} 
                        alt="" 
                        className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                      />
                    )}

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-white font-medium truncate">
                          <Highlight text={product.name} query={searchQuery} />
                        </span>
                        {product.is_hot && (
                          <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-[#FF3B3B]/20 text-[#FF3B3B]">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
                          product.delivery_type === "自动发货" 
                            ? "bg-[#7CFF00]/15 text-[#7CFF00]" 
                            : "bg-[#F7931A]/15 text-[#F7931A]"
                        }`}>
                          {product.delivery_type || "自动发货"}
                        </span>
                        <span className="text-[13px] font-bold text-white">¥{product.price}</span>
                        <StockStatus stock={product.stock} />
                      </div>
                    </div>

                    {/* 购买按钮 */}
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={product.stock <= 0}
                      className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-semibold transition-all ${
                        product.stock > 0
                          ? "bg-[#7CFF00] hover:bg-[#9FFF40] text-black"
                          : "bg-[#2A2A2A] text-[#525252] cursor-not-allowed"
                      }`}
                    >
                      购买
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        {filteredProducts.length > 0 && (
          <div className="mt-4 text-center text-[12px] text-[#525252]">
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
