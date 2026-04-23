"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

// 生成订单号
function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD${timestamp}${random}`
}

interface CreateCheckoutSessionParams {
  productId: string
  quantity: number
}

export async function createCheckoutSession({ productId, quantity }: CreateCheckoutSessionParams) {
  const supabase = await createClient()
  
  // 从数据库获取产品信息
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single()
  
  if (error || !product) {
    throw new Error("产品不存在")
  }
  
  // 检查库存
  if (product.stock < quantity) {
    throw new Error("库存不足")
  }
  
  // 生成订单号
  const orderNo = generateOrderNo()
  
  // 创建订单记录
  const { error: orderError } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      total_amount: product.price * quantity,
      status: "pending",
    })
  
  if (orderError) {
    throw new Error("创建订单失败")
  }
  
  // 创建 Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "alipay"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description || undefined,
          },
          unit_amount: Math.round(product.price * 100), // Stripe 使用最小货币单位（美分）
        },
        quantity,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order/${orderNo}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order/${orderNo}?cancelled=true`,
    metadata: {
      order_no: orderNo,
      product_id: product.id,
      quantity: quantity.toString(),
    },
  })
  
  // 更新订单的 stripe session id
  await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("order_no", orderNo)
  
  return {
    sessionId: session.id,
    orderNo,
    url: session.url,
  }
}

export async function getOrderByNo(orderNo: string) {
  const supabase = await createClient()
  
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("order_no", orderNo)
    .single()
  
  if (error) {
    return null
  }
  
  return order
}
