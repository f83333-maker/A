"use client"

import { useState, useEffect } from "react"
import { X, Copy, Check, Minus, Plus, Info, Loader2, Smartphone, RefreshCw } from "lucide-react"
import { createEpayCheckout } from "@/app/actions/epay"

interface Product {
  id: number | string
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

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateCaptcha(): string {
  let result = ""
  for (let i = 0; i < 4; i++) {
    result += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  }
  return result
}

export function PurchaseModal({ product, isOpen, onClose }: PurchaseModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [contact, setContact] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState("")
  const [captchaError, setCaptchaError] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [paymentType, setPaymentType] = useState<"wxpay" | "alipay">("wxpay")
  const [deliveryText, setDeliveryText] = useState("自动发货")

  // 获取站点设置
  useEffect(() => {
    fetch("/api/site-settings")
      .then(res => res.json())
      .then(data => {
        if (data.delivery_text) setDeliveryText(data.delivery_text)
      })
      .catch(err => console.error("获取设置失败:", err))
  }, [])

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setContact("")
      setQueryPassword("")
      setCaptcha(generateCaptcha())
      setCaptchaInput("")
      setCaptchaError("")
      setCopied(false)
      setError("")
      setPaymentType("wxpay")
    }
  }, [isOpen])
  
  // 记录商品浏览
  useEffect(() => {
    if (isOpen && product) {
      fetch("/api/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          page: `/product/${product.id}`,
          productId: String(product.id)
        })
      }).catch(() => {})
    }
  }, [isOpen, product?.id])

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
    navigator.clipboard.writeText(`${window.location.origin}/#product-${product.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  const handlePurchase = async () => {
    setFormError("")
    if (!contact.trim()) {
      setFormError("请填写联系方式")
      return
    }
    if (!queryPassword.trim() || queryPassword.length < 6) {
      setFormError("请设置6位以上的查询密码")
      return
    }
    if (captchaInput.toUpperCase() !== captcha) {
      setCaptchaError("验证码错误，请重新输入")
      setCaptcha(generateCaptcha())
      setCaptchaInput("")
      return
    }
    setCaptchaError("")

    setIsLoading(true)
    setError("")

    try {
      const result = await createEpayCheckout({
        productId: String(product.id),
        quantity,
        buyerEmail: contact,
        buyerName: contact,
        paymentType,
        queryPassword,
      })

      if (result.success && result.url) {
        // 跳转到易支付页面
        window.location.href = result.url
      } else {
        setError(result.error || "创建订单失败，请重试")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建订单失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 - 80% 透明状态 */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 弹窗主体 - 80% 透明背景 */}
      <div className="relative w-full max-w-lg bg-[#1e1f20]/20 backdrop-blur-xl rounded-2xl border border-[#3c3c3f]/40 shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 可滚动内容区 */}
        <div className="overflow-y-auto flex-1 p-6">
          
          {/* 商品标题 + 发货方式 */}
          <div className="pr-10 mb-4">
            <h2 className="text-[18px] font-semibold text-[#e3e3e3] leading-relaxed mb-2">
              {product.name}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 bg-[#81c995]/15 rounded-full text-[11px] font-medium text-[#81c995]">
              {deliveryText}
            </span>
          </div>

          {/* 复制链接 */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#7CFF00] hover:text-[#9FFF40] transition-colors mb-6"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "已复制" : "复制商品链接"}
          </button>

          {/* 商品信息 */}
          <div className="space-y-4 mb-6">
            {/* 价格 */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#e3e3e3] w-20 shrink-0">商品单价:</span>
              <span className="text-[18px] font-semibold text-[#ca3f64]">¥{product.price}</span>
            </div>

            {/* 联系方式 + 查询密码 同行 */}
            <div className="flex items-start gap-2">
              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[#e3e3e3]">联系方式</span>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="邮箱或联系方式"
                  className="w-full h-7 px-2.5 bg-[#2d2e30] border border-[#3c3c3f] rounded-md text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[#e3e3e3]">查询密码 <span className="text-[#ca3f64] font-medium text-[12px]">(6位以上，请牢记)</span></span>
                <input
                  type="text"
                  value={queryPassword}
                  onChange={(e) => setQueryPassword(e.target.value)}
                  placeholder="设置6位以上密码"
                  minLength={6}
                  className="w-full h-7 px-2.5 bg-[#2d2e30] border border-[#3c3c3f] rounded-md text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                />
              </div>
            </div>

            {/* 验证码 */}
            <div className="flex items-start gap-3">
              <span className="text-[13px] font-semibold text-[#e3e3e3] w-20 shrink-0 pt-2">验证码:</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => { setCaptchaInput(e.target.value.toUpperCase()); setCaptchaError("") }}
                    placeholder="输入右侧验证码"
                    maxLength={4}
                    className="flex-1 h-10 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-md text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] focus:outline-none focus:border-[#7CFF00] transition-colors tracking-[0.3em] uppercase"
                  />
                  {/* 验证码图形 - 放大版 */}
                  <div
                    className="flex items-center justify-center h-10 px-4 rounded-md bg-[#252627] border border-[#3c3c3f] select-none gap-1"
                    style={{ fontFamily: "monospace", minWidth: "96px" }}
                  >
                    {captcha.split("").map((char, i) => (
                      <span
                        key={i}
                        className="font-black"
                        style={{
                          fontSize: "20px",
                          color: ["#7CFF00", "#81c995", "#ca3f64", "#fdd663"][i % 4],
                          transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (5 + i * 2)}deg)`,
                          display: "inline-block",
                          lineHeight: 1,
                          letterSpacing: 0,
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput(""); setCaptchaError("") }}
                    className="h-10 w-10 flex items-center justify-center rounded-md bg-[#2d2e30] border border-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#3c3c3f] transition-all shrink-0"
                    title="刷新验证码"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {captchaError && (
                  <p className="mt-1 text-[11px] text-[#ca3f64]">{captchaError}</p>
                )}
              </div>
            </div>

            {/* 购买数量 */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#e3e3e3] w-20 shrink-0">购买数量:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#3c3c3f] rounded-md overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      if (val >= 1 && val <= product.stock) setQuantity(val)
                    }}
                    className="w-10 h-7 text-center bg-[#1e1f20] border-x border-[#3c3c3f] text-[#e3e3e3] text-[13px] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="w-7 h-7 flex items-center justify-center bg-[#2d2e30] hover:bg-[#3c3c3f] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="flex items-center gap-1 text-[13px]">
                  <span className="text-[#9aa0a6]">库存: </span>
                  <span className={`font-semibold ${product.stock <= 0 ? "text-[#ca3f64]" : product.stock <= 10 ? "text-[#ca3f64]" : product.stock <= 20 ? "text-[#fdd663]" : "text-[#81c995]"}`}>
                    {product.stock <= 0 ? "售罄" : product.stock <= 10 ? "库存紧张" : product.stock <= 20 ? "库存一般" : "库存充足"}
                  </span>
                </span>
              </div>
            </div>

            {/* 订单金额 */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#3c3c3f]/50">
              <span className="text-[13px] font-semibold text-[#e3e3e3] w-20 shrink-0">订单金额:</span>
              <span className="text-[22px] font-semibold text-[#ca3f64]">¥{totalPrice}</span>
            </div>
          </div>

          {/* 支付方式选择 */}
          <div className="mb-6">
            <p className="text-[13px] font-semibold text-[#e3e3e3] mb-3">选择支付方式:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentType("wxpay")}
                className={`p-3 rounded-xl border-2 transition-all ${
                  paymentType === "wxpay"
                    ? "border-[#07c160] bg-[#07c160]/10"
                    : "border-[#3c3c3f] bg-[#2d2e30] hover:border-[#07c160]/50"
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#07c160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.245 0-.06-.023-.118-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89a9.49 9.49 0 00-.406-.032zm-2.53 2.703c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                  <span className="text-[13px] font-semibold text-[#e3e3e3]">微信支付</span>
                </div>
              </button>
              <button
                onClick={() => setPaymentType("alipay")}
                className={`p-3 rounded-xl border-2 transition-all ${
                  paymentType === "alipay"
                    ? "border-[#1677ff] bg-[#1677ff]/10"
                    : "border-[#3c3c3f] bg-[#2d2e30] hover:border-[#1677ff]/50"
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1677ff">
                    <path d="M20.422 16.464c-2.04-.696-3.792-1.368-3.792-1.368s.6-1.464.984-3.144h-3.384v-1.272h3.936v-.816h-3.936v-2.04h3.096c-.12-.312-.312-.768-.552-1.248l1.776-.552c.336.672.648 1.32.84 1.8h2.856v2.04h-3.816v.816h3.696v1.272h-4.944c-.24 1.008-.576 1.896-.576 1.896 2.64 1.056 7.344 2.976 7.344 2.976.168-1.056.336-2.208.336-3.456C24.258 6.336 18.834.912 12.114.912S0 6.336 0 13.128s5.406 12.216 12.114 12.216c4.512 0 8.472-2.472 10.584-6.144-1.008-.384-1.752-.648-2.28-.864l.004.128zM8.97 19.68c-2.976 0-5.4-1.752-5.4-5.112 0-2.904 1.944-4.944 4.824-4.944 2.376 0 4.488 1.488 4.488 4.272 0 2.208-1.176 3.792-2.808 3.792-.792 0-1.368-.504-1.368-1.344 0-.168.024-.336.072-.528l1.056-4.248h-1.512l-.264 1.056c-.384-1.008-1.272-1.296-2.064-1.296-2.112 0-3.528 1.92-3.528 4.296 0 1.752.936 2.976 2.52 2.976 1.104 0 2.016-.624 2.568-1.68.072.984.696 1.68 1.776 1.68 2.352 0 4.056-2.16 4.056-5.016 0-3.456-2.592-5.448-5.664-5.448-3.6 0-6.12 2.688-6.12 6.168 0 4.08 2.976 6.336 6.6 6.336 1.104 0 2.208-.192 3.024-.504l-.312-1.176c-.696.216-1.488.336-2.304.336l-.65.004zm-.042-4.128c0 1.32-.816 2.16-1.704 2.16-.744 0-1.224-.504-1.224-1.392 0-1.416.936-2.568 2.16-2.568.408 0 .744.12.936.312l-.168.816v.672z"/>
                  </svg>
                  <span className="text-[13px] font-semibold text-[#e3e3e3]">支付宝</span>
                </div>
              </button>
            </div>
          </div>

          {/* 商品介绍 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#7CFF00]" />
              <span className="text-[13px] font-semibold text-[#e3e3e3]">商品介绍:</span>
            </div>
            <div className="bg-[#2d2e30] rounded-xl p-4 text-[13px] text-[#9aa0a6] leading-relaxed font-medium">
              <p>{product.description}</p>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-[#ca3f64]/10 border border-[#ca3f64]/30 rounded-xl">
              <p className="text-[13px] text-[#ca3f64] font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-[#3c3c3f]/50 bg-[#1e1f20]">
          <div className="relative">
            {/* 表单校验错误气泡 */}
            {formError && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap">
                <div className="bg-[#ee675c] text-white text-[13px] font-medium px-3 py-1.5 rounded-lg shadow-lg">
                  {formError}
                </div>
                <div className="w-2 h-2 bg-[#ee675c] rotate-45 mx-auto -mt-1" />
              </div>
            )}
            <button
              onClick={handlePurchase}
              disabled={isLoading || product.stock < 1}
              className={`w-full py-3 font-semibold rounded-xl transition-all duration-200 text-[15px] flex items-center justify-center gap-2 ${
                paymentType === "wxpay"
                  ? "bg-[#07c160] hover:bg-[#06ad56] text-white disabled:bg-[#3c3c3f]"
                  : "bg-[#1677ff] hover:bg-[#0958d9] text-white disabled:bg-[#3c3c3f]"
              } disabled:cursor-not-allowed disabled:text-[#6e6e73]`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  {paymentType === "wxpay" ? "微信支付" : "支付宝支付"} · ¥{totalPrice}
                </>
              )}
            </button>
          </div>
          {/* 免责声明 */}
          <p className="mt-3 text-[11px] text-[#6e6e73] text-center leading-relaxed">
            点击支付即表示您已阅读并同意本站
            <span className="text-[#7CFF00]">免责声明</span>
            ：本店只提供账号用于出海学习与交流，如若用于其他任何非法用途与本店无关；本店不参与客户任何项目，也不教授任何软件使用方法；本店账号来源于正规海外资源，不涉及任何个人公民信息。
          </p>
        </div>
      </div>
    </div>
  )
}
