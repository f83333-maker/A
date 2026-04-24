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
 * 易支付签名规则：
 * 1. 将参数按照参数名ASCII码从小到大排序
 * 2. 排除空值和sign、sign_type参数
 * 3. 拼接成 key=value&key=value 格式
 * 4. 在末尾直接拼接密钥（不加&key=）
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
  
  // 拼接字符串：key1=value1&key2=value2&...
  const str = keys.map((k) => `${k}=${filteredParams[k]}`).join("&")
  
  // 在末尾直接拼接密钥（易支付标准格式）：str + 密钥
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

  // 签名参数（必须的参数）
  const signParams: Record<string, string> = {
    pid: epayConfig.pid,
    type: type,
    out_trade_no: orderNo,
    notify_url: notifyUrl,
    return_url: options.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/order/${orderNo}`,
    name: buyerName || "商品购买",
    money: amount.toFixed(2),
  }

  // 生成签名
  const sign = generateSign(signParams)

  // 构建支付 URL（使用表单提交方式更可靠）
  const searchParams = new URLSearchParams()
  searchParams.append("pid", signParams.pid)
  searchParams.append("type", signParams.type)
  searchParams.append("out_trade_no", signParams.out_trade_no)
  searchParams.append("notify_url", signParams.notify_url)
  searchParams.append("return_url", signParams.return_url)
  searchParams.append("name", signParams.name)
  searchParams.append("money", signParams.money)
  searchParams.append("sign", sign)
  searchParams.append("sign_type", "MD5")

  return `${epayConfig.apiUrl}submit.php?${searchParams.toString()}`
}
