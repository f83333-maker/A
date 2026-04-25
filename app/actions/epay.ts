"use server"

import { createEpayOrder } from "@/lib/epay"
import { createClient } from "@/lib/supabase/server"
import { encryptData } from "@/lib/encryption"

// 生产域名 - 直接硬编码确保回调地址正确
const PRODUCTION_URL = "https://pcccc.cc"

async function getBaseUrl(): Promise<string> {
  // 生产环境直接返回硬编码域名
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_URL
  }
  
  // 开发环境使用环境变量或本地地址
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  return "http://localhost:3000"
}

export async function createEpayCheckout(options: {
  productId: string
  quantity: number
  buyerEmail?: string
  buyerName?: string
  paymentType: "wxpay" | "alipay"
  queryPassword?: string
}) {
  const { productId, quantity, buyerEmail, buyerName, paymentType, queryPassword } = options

  try {
    const supabase = await createClient()

    // 获取产品信息
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      throw new Error("产品不存在")
    }

    // 检查库存
    if (product.stock < quantity) {
      throw new Error("库存不足")
    }

    // 生成订单号：ZH + 年月日时分秒毫秒 + 3位随机字母数字
    const now = new Date()
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(now.getMilliseconds()).padStart(3, '0')
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const randomStr = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const orderNo = `ZH${dateStr}${randomStr}`
    const totalAmount = (product.price * quantity)

    // 创建订单记录（使用超强加密密码）
    let passwordEncrypted = null
    let passwordSalt = null
    
    if (queryPassword) {
      const { encrypted, salt } = await encryptData(queryPassword)
      passwordEncrypted = encrypted
      passwordSalt = salt
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        product_id: productId,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total_amount: totalAmount,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: "pending",
        query_password: passwordEncrypted,
        query_password_salt: passwordSalt,
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error("创建订单失败")
    }

    // 获取回调 URL
    const baseUrl = await getBaseUrl()
    // notify_url: 异步通知，POST请求，返回"success"
    // return_url: 同步跳转，GET请求，跳转到订单页面
    const notifyUrl = `${baseUrl}/api/webhooks/epay`
    const returnUrl = `${baseUrl}/api/webhooks/epay`

    // 创建易支付支付 URL
    const paymentUrl = await createEpayOrder({
      orderNo,
      amount: totalAmount,
      productId,
      quantity,
      buyerEmail,
      buyerName,
      notifyUrl,
      returnUrl,
      type: paymentType,
    })

    return {
      success: true,
      url: paymentUrl,
      orderNo,
    }
  } catch (error) {
    console.error("创建易支付订单失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建订单失败",
    }
  }
}
