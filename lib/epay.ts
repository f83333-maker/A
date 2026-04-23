import "server-only"
import crypto from "crypto"

// 易支付 API 配置
export const epayConfig = {
  pid: process.env.EPAY_PID!,
  key: process.env.EPAY_KEY!,
  apiUrl: process.env.EPAY_API_URL || "https://pay.yi-zhifu.cn/",
}

/**
 * 生成签名
 */
export function generateSign(params: Record<string, any>): string {
  const keys = Object.keys(params).sort()
  const str = keys.map((k) => `${k}=${params[k]}`).join("&") + epayConfig.key
  return crypto.createHash("md5").update(str).digest("hex")
}

/**
 * 验证易支付回调签名
 */
export function verifyEpaySign(params: Record<string, any>, sign: string): boolean {
  const calculated = generateSign(params)
  return calculated === sign
}

/**
 * 创建支付订单
 */
export async function createEpayOrder(options: {
  orderNo: string
  amount: number // 单位：元
  productId: string
  quantity: number
  buyerEmail?: string
  buyerName?: string
  returnUrl?: string
  notifyUrl: string
  type: "wxpay" | "alipay" // 支付类型
}): Promise<string> {
  const {
    orderNo,
    amount,
    productId,
    quantity,
    buyerEmail,
    buyerName,
    notifyUrl,
    type,
  } = options

  const params: Record<string, any> = {
    pid: epayConfig.pid,
    type: type, // wxpay: 微信支付, alipay: 支付宝
    out_trade_no: orderNo,
    money: amount.toFixed(2), // 易支付使用 money 字段表示金额
    name: buyerName || "商品购买",
    notify_url: notifyUrl,
    return_url: options.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/order/${orderNo}`,
  }

  // 添加自定义参数用于后续查询
  params.custom = JSON.stringify({
    productId,
    quantity,
    buyerEmail,
    buyerName,
  })

  params.sign = generateSign(params)

  // 构建支付 URL
  const searchParams = new URLSearchParams(params)
  return `${epayConfig.apiUrl}submit.php?${searchParams.toString()}`
}
