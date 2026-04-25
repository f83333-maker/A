import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

/**
 * 为订单生成安全的查询令牌
 */
export async function generateOrderToken(orderId: string): Promise<string> {
  const supabase = await createClient()
  
  // 生成随机 token - 使用高强度随机数
  const token = crypto.randomBytes(32).toString("hex")
  
  // 保存 token 到数据库
  const { error } = await supabase
    .from("order_tokens")
    .insert({
      order_id: orderId,
      token: token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  
  if (error) {
    console.error("Failed to create order token:", error)
    throw new Error("Failed to generate order token")
  }
  
  return token
}

/**
 * 通过 token 获取订单信息
 */
export async function getOrderByToken(token: string) {
  const supabase = await createClient()
  
  // 获取 token 记录
  const { data: tokenData, error: tokenError } = await supabase
    .from("order_tokens")
    .select("order_id, expires_at")
    .eq("token", token)
    .single()
  
  if (tokenError || !tokenData) {
    return null
  }
  
  // 检查 token 是否过期
  if (new Date(tokenData.expires_at) < new Date()) {
    return null
  }
  
  // 获取订单详情
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", tokenData.order_id)
    .single()
  
  if (orderError || !order) {
    return null
  }
  
  return order
}

/**
 * 验证 token 并返回订单号
 */
export async function verifyOrderToken(token: string): Promise<string | null> {
  const order = await getOrderByToken(token)
  return order?.order_no || null
}
