"use client"

import Link from "next/link"
import { ShoppingCart, Star, TrendingUp, PackageSearch } from "lucide-react"

const products = [
  {
    id: 1,
    name: "示例产品 A",
    description: "高质量账号服务，专业售后保障",
    price: 29.99,
    originalPrice: 49.99,
    sales: 1234,
    stock: 999,
    rating: 4.9,
    tag: "热销",
    tagColor: "#ee675c",
    category: "社交账号",
  },
  {
    id: 2,
    name: "示例产品 B",
    description: "稳定可靠，长期使用无忧",
    price: 19.99,
    originalPrice: 29.99,
    sales: 856,
    stock: 500,
    rating: 4.8,
    tag: "推荐",
    tagColor: "#7CFF00",
    category: "邮箱账号",
  },
  {
    id: 3,
    name: "示例产品 C",
    description: "批量优惠，企业首选",
    price: 99.99,
    originalPrice: 149.99,
    sales: 432,
    stock: 200,
    rating: 4.7,
    tag: "批发",
    tagColor: "#81c995",
    category: "海外账号",
  },
  {
    id: 4,
    name: "示例产品 D",
    description: "新品上市，限时特惠",
    price: 15.99,
    originalPrice: 25.99,
    sales: 678,
    stock: 888,
    rating: 4.6,
    tag: "新品",
    tagColor: "#fdd663",
    category: "游戏账号",
  },
  {
    id: 5,
    name: "示例产品 E",
    description: "高端定制，尊享服务",
    price: 199.99,
    originalPrice: 299.99,
    sales: 234,
    stock: 100,
    rating: 5.0,
    tag: "尊享",
    tagColor: "#af87c9",
    category: "社交账号",
  },
  {
    id: 6,
    name: "示例产品 F",
    description: "基础款式，性价比之选",
    price: 9.99,
    originalPrice: 19.99,
    sales: 2345,
    stock: 1500,
    rating: 4.5,
    tag: "超值",
    tagColor: "#81c995",
    category: "邮箱账号",
  },
]

// 高亮匹配文字
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#7CFF00]/25 text-[#7CFF00] rounded-[3px] px-[1px]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// 全字段模糊匹配
function matchesQuery(product: typeof products[number], query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return [
    product.name,
    product.description,
    product.tag,
    product.category,
    String(product.price),
    String(product.originalPrice),
    String(product.sales),
    String(product.stock),
    String(product.rating),
  ].some((field) => field.toLowerCase().includes(q))
}

interface ProductListProps {
  searchQuery: string
}

export function ProductList({ searchQuery }: ProductListProps) {
  const filtered = products.filter((p) => matchesQuery(p, searchQuery))

  return (
    <section className="py-16 md:py-20 bg-[#1e1f20]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 标题区域 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#7CFF00]" />
              <span className="text-[12px] text-[#7CFF00] font-semibold uppercase tracking-wider">Popular</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#e3e3e3] tracking-[-0.01em]">
              {searchQuery ? (
                <>
                  搜索结果
                  <span className="ml-3 text-[16px] font-medium text-[#6e6e73]">
                    共 {filtered.length} 件
                  </span>
                </>
              ) : "精选产品"}
            </h2>
          </div>
          {!searchQuery && (
            <Link 
              href="/products" 
              className="text-[14px] text-[#7CFF00] hover:text-[#9FFF40] transition-colors"
            >
              查看全部 →
            </Link>
          )}
        </div>

        {/* 无结果状态 */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
            <PackageSearch className="w-12 h-12 text-[#3c3c3f]" />
            <p className="text-[16px] font-semibold text-[#6e6e73]">未找到匹配的产品</p>
            <p className="text-[14px] text-[#3c3c3f]">
              试试搜索 <span className="text-[#9aa0a6]">产品名称、价格、分类</span> 等关键词
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product, index) => (
              <div
                key={product.id}
                className="group relative bg-[#131314] rounded-2xl border border-[#3c3c3f]/50 overflow-hidden hover:border-[#3c3c3f] transition-all duration-300 animate-fade-in-up"
                style={{ 
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: "backwards"
                }}
              >
                {/* 标签 */}
                <div 
                  className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-[11px] font-medium z-10"
                  style={{ 
                    backgroundColor: `${product.tagColor}15`,
                    color: product.tagColor
                  }}
                >
                  <Highlight text={product.tag} query={searchQuery} />
                </div>

                {/* 卡片内容 */}
                <div className="p-5">
                  {/* 产品图标区域 */}
                  <div className="w-full h-28 mb-5 rounded-xl bg-[#2d2e30] flex items-center justify-center overflow-hidden group-hover:bg-[#3c3c3f] transition-colors duration-300">
                    <div className="text-[42px] transition-transform duration-300 group-hover:scale-110">
                      📦
                    </div>
                  </div>

                  {/* 产品信息 */}
                  <h3 className="text-[16px] font-semibold text-[#e3e3e3] mb-1.5 group-hover:text-white transition-colors">
                    <Highlight text={product.name} query={searchQuery} />
                  </h3>
                  <p className="text-[13px] text-[#6e6e73] mb-4 line-clamp-1 font-medium">
                    <Highlight text={product.description} query={searchQuery} />
                  </p>

                  {/* 分类标签 */}
                  <div className="mb-4">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#2d2e30] text-[#9aa0a6]">
                      <Highlight text={product.category} query={searchQuery} />
                    </span>
                  </div>

                  {/* 评分和销量 */}
                  <div className="flex items-center gap-4 mb-4 text-[13px]">
                    <div className="flex items-center gap-1 text-[#fdd663]">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>
                        <Highlight text={String(product.rating)} query={searchQuery} />
                      </span>
                    </div>
                    <span className="text-[#6e6e73]">
                      已售 <Highlight text={product.sales.toLocaleString()} query={searchQuery} />
                    </span>
                  </div>

                  {/* 价格和购买 */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[22px] font-semibold text-[#7CFF00]">
                        ¥<Highlight text={String(product.price)} query={searchQuery} />
                      </span>
                      <span className="ml-2 text-[13px] text-[#6e6e73] line-through font-medium">
                        ¥<Highlight text={String(product.originalPrice)} query={searchQuery} />
                      </span>
                    </div>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2d2e30] hover:bg-[#7CFF00] text-[#e3e3e3] hover:text-[#131314] rounded-xl transition-all duration-300 text-[13px] font-semibold">
                      <ShoppingCart className="w-4 h-4" />
                      购买
                    </button>
                  </div>

                  {/* 库存提示 */}
                  <div className="mt-4 pt-4 border-t border-[#3c3c3f]/50">
                    <div className="flex justify-between text-[12px] text-[#6e6e73] font-medium">
                      <span>
                        库存: <Highlight text={String(product.stock)} query={searchQuery} />
                      </span>
                      <span className="text-[#81c995]">即时发货</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
