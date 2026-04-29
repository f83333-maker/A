import "server-only"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

// 易支付 API 配置缓存
let epayConfigCache: { pid: string; key: string; apiUrl: string; configId?: string; configName?: string } | null = null
let configLastFetch = 0
const CONFIG_CACHE_TTL = 60000 // 1分钟缓存

// 从数据库获取易支付配置（优先从 payment_configs 表，回退到 site_settings）
export async function getEpayConfig(configId?: string) {
  const now = Date.now()
  
  // 如果没有指定 configId 且有缓存，使用缓存
  if (!configId && epayConfigCache && (now - configLastFetch) < CONFIG_CACHE_TTL) {
    return epayConfigCache
  }
  
  try {
    const supabase = createAdminClient()
    
    // 优先从 payment_configs 表获取
    let query = supabase
      .from("payment_configs")
      .select("*")
      .eq("is_active", true)
    
    if (configId) {
      query = query.eq("id", configId)
    } else {
      query = query.order("sort_order", { ascending: true }).limit(1)
    }
    
    const { data: configs } = await query
    
    if (configs && configs.length > 0) {
      const config = configs[0]
      epayConfigCache = {
        pid: config.merchant_id || "",
        key: config.merchant_key || "",
        apiUrl: config.api_url || "",
        configId: config.id,
        configName: config.name,
      }
      configLastFetch = now
      return epayConfigCache
    }
    
    // 回退到 site_settings 表（兼容旧版）
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["epay_api_url", "epay_pid", "epay_key"])
    
    const settings: Record<string, string> = {}
    data?.forEach((item) => {
      try {
        settings[item.key] = JSON.parse(item.value)
      } catch {
        settings[item.key] = item.value
      }
    })
    
    epayConfigCache = {
      pid: settings.epay_pid || process.env.EPAY_PID || "",
      key: settings.epay_key || process.env.EPAY_KEY || "",
      apiUrl: settings.epay_api_url || process.env.EPAY_API_URL || "",
    }
    configLastFetch = now
    
    return epayConfigCache
  } catch (error) {
    console.error("获取易支付配置失败:", error)
    // 回退到环境变量
    return {
      pid: process.env.EPAY_PID || "",
      key: process.env.EPAY_KEY || "",
      apiUrl: process.env.EPAY_API_URL || "",
    }
  }
}

// 向后兼容的同步配置（用于签名验证等）
export const epayConfig = {
  get pid() { return epayConfigCache?.pid || process.env.EPAY_PID || "" },
  get key() { return epayConfigCache?.key || process.env.EPAY_KEY || "" },
  get apiUrl() { return epayConfigCache?.apiUrl || process.env.EPAY_API_URL || "" },
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
 * 验证易支付回调签名（异步版本，从数据库获取密钥）
 */
export async function verifyEpaySign(params: Record<string, any>): Promise<boolean> {
  const sign = params.sign
  if (!sign) return false
  
  // 获取配置中的密钥
  const config = await getEpayConfig()
  if (!config.key) {
    console.error("易支付密钥未配置")
    return false
  }
  
  // 复制参数并移除sign字段用于验证
  const verifyParams = { ...params }
  delete verifyParams.sign
  delete verifyParams.sign_type
  
  const calculated = generateSignWithKey(verifyParams, config.key)
  return calculated === sign
}

/**
 * 生成签名（使用提供的密钥）
 */
export function generateSignWithKey(params: Record<string, any>, key: string): string {
  const filteredParams: Record<string, string> = {}
  for (const k of Object.keys(params)) {
    if (params[k] !== "" && params[k] !== null && params[k] !== undefined && k !== "sign" && k !== "sign_type") {
      filteredParams[k] = String(params[k])
    }
  }
  
  const keys = Object.keys(filteredParams).sort()
  const str = keys.map((k) => `${k}=${filteredParams[k]}`).join("&")
  const signStr = str + key
  
  return crypto.createHash("md5").update(signStr).digest("hex")
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
    notifyUrl,
    type,
  } = options

  // 获取最新配置
  const config = await getEpayConfig()
  
  if (!config.pid || !config.key || !config.apiUrl) {
    throw new Error("支付配置未完成，请在后台设置易支付参数")
  }

  // 签名参数（必须的参数）
  const signParams: Record<string, string> = {
    pid: config.pid,
    type: type,
    out_trade_no: orderNo,
    notify_url: notifyUrl,
    return_url: options.returnUrl || "",
    name: options.buyerName || "商品购买",
    money: amount.toFixed(2),
  }

  // 使用配置中的密钥生成签名
  const sign = generateSignWithKey(signParams, config.key)

  // 构建支付 URL
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

  // 确保 API URL 格式正确
  const apiUrl = config.apiUrl.endsWith("/") ? config.apiUrl : config.apiUrl + "/"
  return `${apiUrl}submit.php?${searchParams.toString()}`
}
