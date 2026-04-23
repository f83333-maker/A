"use client"

import { useState, useEffect } from "react"
import { X, Copy, Check, Minus, Plus, Info, Zap } from "lucide-react"

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice: number
  sales: number
  stock: number
  rating: number
  tag: string
  tagColor: string
  categoryId: string
}

interface PurchaseModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

const paymentMethods = [
  { id: "usdt", name: "USDT-TRC20", icon: "💎", color: "#26a17b" },
  { id: "trx", name: "TRON-TRX", icon: "🔷", color: "#eb0029" },
  { id: "wechat", name: "微信支付", icon: "💬", fee: "8%", color: "#07c160" },
  { id: "alipay", name: "支付宝", icon: "🔵", fee: "8%", color: "#1677ff" },
  { id: "wechat2", name: "微信(备用)", icon: "💬", color: "#07c160" },
  { id: "alipay2", name: "支付宝(备用)", icon: "🔵", color: "#1677ff" },
]

export function PurchaseModal({ product, isOpen, onClose }: PurchaseModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [contact, setContact] = useState("")
  const [selectedPayment, setSelectedPayment] = useState("usdt")
  const [copied, setCopied] = useState(false)

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setContact("")
      setSelectedPayment("usdt")
      setCopied(false)
    }
  }, [isOpen])

  // 按 ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const totalPrice = (product.price * quantity).toFixed(2)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 弹窗主体 */}
      <div className="relative w-full max-w-lg bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 可滚动内容区 */}
        <div className="overflow-y-auto flex-1 p-6">
          
          {/* 商品标题 */}
          <h2 className="text-[18px] font-semibold text-[#e3e3e3] pr-10 mb-4 leading-relaxed">
            {product.name}
          </h2>

          {/* 复制链接 */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#8ab4f8] hover:text-[#aecbfa] transition-colors mb-6"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "已复制" : "复制商品链接"}
          </button>

          {/* 商品信息 */}
          <div className="space-y-4 mb-6">
            {/* 价格 */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-[#9aa0a6] w-20 shrink-0">商品单价:</span>
              <span className="text-[18px] font-semibold text-[#ee675c]">¥{product.price}</span>
            </div>

            {/* 发货方式 */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-[#9aa0a6] w-20 shrink-0">发货方式:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#81c995]/15 text-[#81c995] text-[12px] font-semibold rounded-md">
                <Zap className="w-3 h-3" />
                自动发货
              </span>
            </div>

            {/* 联系方式 */}
            <div className="flex items-start gap-3">
              <span className="text-[13px] font-medium text-[#9aa0a6] w-20 shrink-0 pt-2">联系方式:</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="请输入您的任意联系方式"
                  className="w-full h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] font-medium focus:outline-none focus:border-[#8ab4f8] transition-colors"
                />
                <p className="mt-2 text-[12px] font-medium text-[#81c995] leading-relaxed">
                  联系方式用于查询订单，请勿随意填写，以便查询订单
                </p>
                <p className="mt-1 text-[12px] font-medium text-[#fdd663] leading-relaxed">
                  未登录时购买，联系方式请勿过于简单，以免被盗！
                </p>
              </div>
            </div>

            {/* 购买数量 */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-[#9aa0a6] w-20 shrink-0">购买数量:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#3c3c3f] rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      if (val >= 1 && val <= product.stock) setQuantity(val)
                    }}
                    className="w-14 h-9 text-center bg-[#1e1f20] border-x border-[#3c3c3f] text-[#e3e3e3] text-[14px] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="w-9 h-9 flex items-center justify-center bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[13px] font-medium">
                  <span className="text-[#6e6e73]">库存: </span>
                  <span className="text-[#8ab4f8]">{product.stock}</span>
                </span>
              </div>
            </div>

            {/* 订单金额 */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#3c3c3f]/50">
              <span className="text-[13px] font-medium text-[#9aa0a6] w-20 shrink-0">订单金额:</span>
              <span className="text-[22px] font-semibold text-[#ee675c]">¥{totalPrice}</span>
            </div>
          </div>

          {/* 付款方式 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] font-medium text-[#9aa0a6]">付款方式:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-[12px] font-semibold transition-all duration-200 ${
                    selectedPayment === method.id
                      ? "border-[#8ab4f8] bg-[#8ab4f8]/10 text-[#e3e3e3]"
                      : "border-[#3c3c3f] bg-[#2d2e30] text-[#9aa0a6] hover:border-[#5f6368] hover:text-[#e3e3e3]"
                  }`}
                >
                  <span>{method.icon}</span>
                  <span>{method.name}</span>
                  {method.fee && (
                    <span className="text-[10px] text-[#fdd663]">(费率{method.fee})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 商品介绍 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#8ab4f8]" />
              <span className="text-[13px] font-semibold text-[#e3e3e3]">商品介绍:</span>
            </div>
            <div className="bg-[#2d2e30] rounded-xl p-4 text-[13px] text-[#9aa0a6] leading-relaxed font-medium space-y-2">
              <p>{product.description}</p>
              <p>购买后系统自动发货，请在订单中查看账号信息。</p>
              <p>如遇问题请及时联系客服处理，24小时在线。</p>
              <p className="text-[#8ab4f8]">登录24小时后踢出其它设备！并修改二级密码</p>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-[#3c3c3f]/50 bg-[#1e1f20]">
          <button
            disabled={!contact.trim()}
            className="w-full py-3 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:bg-[#3c3c3f] disabled:cursor-not-allowed text-[#131314] disabled:text-[#6e6e73] font-semibold rounded-xl transition-all duration-200 text-[15px]"
          >
            立即购买 · ¥{totalPrice}
          </button>
        </div>
      </div>
    </div>
  )
}
