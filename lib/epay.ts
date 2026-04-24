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
 * 易支付签名规则（彩虹易支付标准）：
 * 1. 将参数按照参数名ASCII码从小到大排序
 * 2. 排除空值和sign、sign_type参数
 * 3. 拼接成 key=value&key=value 格式
 * 4. 在末尾直接拼接密钥（不带&key=）
 * 5. 进行MD5加密
 */
export function generateSign(params: Record<string, any>): string {
  // 过滤空值和sign、sign_type
  const filteredParams: Record<string, string> = {}
  for (const key of Object.keys(params)) {
    if (params[key] !== "" && params[key] !== null && params[key] !== undefined && key !== "sign" && key !== "sign_type") {
      filteredParams[key] = String(params[key])
    }
  }
  
  // 按ASCII码排序
  const keys = Object.keys(filteredParams).sort()
  
  // 拼接字符串
  const str = keys.map((k) => `${k}=${filteredParams[k]}`).join("&")
  
  // 在末尾直接拼接密钥（彩虹易支付标准格式）
  const signStr = str + epayConfig.key
  
  // MD5加密
  const sign = crypto.createHash("md5").update(signStr).digest("hex")
  
  return sign
}

/**
 * 验证易支付回调签名
 */
export function verifyEpaySign(params: Record<string, any>): boolean {
  const sign = params.sign
  if (!sign) return false
  
  // 复制参数并移除sign字段用于验证
  const verifyParams = { ...params }
  delete verifyParams.sign
  delete verifyParams.sign_type
  
  const calculated = generateSign(verifyParams)
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

  // 签名需要排除custom字段（易支付的要求）
  const signParams = {
    pid: params.pid,
    type: params.type,
    out_trade_no: params.out_trade_no,
    money: params.money,
    name: params.name,
    notify_url: params.notify_url,
    return_url: params.return_url,
  }

  params.sign = generateSign(signParams)
  params.sign_type = "MD5"

  // 调试日志
  console.log("[v0] 易支付签名调试:")
  console.log("[v0] signParams:", JSON.stringify(signParams, null, 2))
  console.log("[v0] 签名字符串:", Object.keys(signParams).sort().map(k => `${k}=${signParams[k as keyof typeof signParams]}`).join("&") + epayConfig.key)
  console.log("[v0] 生成的签名:", params.sign)

  // 构建支付 URL
  const searchParams = new URLSearchParams()
  // 按照易支付的要求添加参数顺序
  searchParams.append("pid", params.pid)
  searchParams.append("type", params.type)
  searchParams.append("out_trade_no", params.out_trade_no)
  searchParams.append("money", params.money)
  searchParams.append("name", params.name)
  searchParams.append("notify_url", params.notify_url)
  searchParams.append("return_url", params.return_url)
  searchParams.append("sign", params.sign)
  searchParams.append("sign_type", params.sign_type)

  return `${epayConfig.apiUrl}submit.php?${searchParams.toString()}`
}
