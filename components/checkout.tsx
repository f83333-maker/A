"use client"

import { useState } from "react"
import { createCheckoutSession } from "@/app/actions/stripe"
import { loadStripe } from "@stripe/stripe-js"
import { Loader2, ShoppingCart, Minus, Plus, X } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutModalProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    description?: string
  }
  isOpen: boolean
  onClose: () => void
}

export function CheckoutModal({ product, isOpen, onClose }: CheckoutModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const totalPrice = product.price * quantity

  const handleCheckout = async () => {
    setIsLoading(true)
    setError("")

    try {
      const { url } = await createCheckoutSession({
        productId: product.id,
        quantity,
      })

      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建订单失败")
    } finally {
      setIsLoading(false)
    }
  }

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-md mx-4 p-6 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#2d2e30] hover:bg-[#3c3c3f] transition-colors"
        >
          <X className="w-4 h-4 text-[#9aa0a6]" />
        </button>

        {/* 标题 */}
        <h2 className="text-[20px] font-semibold text-[#e3e3e3] mb-6">确认购买</h2>

        {/* 产品信息 */}
        <div className="bg-[#2d2e30] rounded-xl p-4 mb-6">
          <h3 className="text-[16px] font-medium text-[#e3e3e3] mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-[13px] text-[#9aa0a6] mb-3">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#9aa0a6]">单价</span>
            <span className="text-[18px] font-bold text-[#8ab4f8]">${product.price}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[14px] text-[#9aa0a6]">库存</span>
            <span className={`text-[14px] font-semibold ${product.stock <= 0 ? "text-[#ee675c]" : product.stock <= 10 ? "text-[#ee675c]" : product.stock <= 20 ? "text-[#fdd663]" : "text-[#81c995]"}`}>
              {product.stock <= 0 ? "售罄" : product.stock <= 10 ? "库存紧张" : product.stock <= 20 ? "库存一般" : "库存充足"}
            </span>
          </div>
        </div>

        {/* 数量选择 */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-[14px] font-medium text-[#e3e3e3]">购买数量</span>
          <div className="flex items-center gap-3">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#2d2e30] hover:bg-[#3c3c3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4 text-[#e3e3e3]" />
            </button>
            <span className="w-12 text-center text-[18px] font-semibold text-[#e3e3e3]">
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              disabled={quantity >= product.stock}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#2d2e30] hover:bg-[#3c3c3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4 text-[#e3e3e3]" />
            </button>
          </div>
        </div>

        {/* 总价 */}
        <div className="flex items-center justify-between py-4 border-t border-[#3c3c3f] mb-6">
          <span className="text-[16px] font-medium text-[#e3e3e3]">总计</span>
          <span className="text-[24px] font-bold text-[#fdd663]">${totalPrice.toFixed(2)}</span>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-[#ee675c]/10 border border-[#ee675c]/30 rounded-xl">
            <p className="text-[13px] text-[#ee675c]">{error}</p>
          </div>
        )}

        {/* 购买按钮 */}
        <button
          onClick={handleCheckout}
          disabled={isLoading || product.stock < 1}
          className="w-full h-12 flex items-center justify-center gap-2 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:bg-[#3c3c3f] disabled:cursor-not-allowed rounded-xl text-[#131314] font-semibold text-[15px] transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              处理中...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              立即购买
            </>
          )}
        </button>

        {/* 支付方式提示 */}
        <p className="mt-4 text-center text-[12px] text-[#6e6e73]">
          支持信用卡、Alipay 等多种支付方式
        </p>
      </div>
    </div>
  )
}
