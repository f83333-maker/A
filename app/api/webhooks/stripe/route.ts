import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  // 处理支付成功事件
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const orderNo = session.metadata?.order_no
    const productId = session.metadata?.product_id
    const quantity = parseInt(session.metadata?.quantity || "1")

    if (!orderNo || !productId) {
      console.error("Missing metadata in session:", session.id)
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    try {
      // 获取产品信息（包含 product_info 账号内容）
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (!product) {
        throw new Error("Product not found")
      }

      // 获取要发放的账号内容
      // product_info 字段存储账号信息，每行一个账号
      const accountLines = product.product_info?.split("\n").filter((line: string) => line.trim()) || []
      const deliveredAccounts = accountLines.slice(0, quantity).join("\n")
      const remainingAccounts = accountLines.slice(quantity).join("\n")

      // 更新订单状态为已支付并发放账号
      await supabase
        .from("orders")
        .update({
          status: "delivered",
          stripe_payment_intent_id: session.payment_intent as string,
          buyer_email: session.customer_details?.email || null,
          buyer_name: session.customer_details?.name || null,
          delivered_content: deliveredAccounts || "账号将由管理员手动发放",
          delivered_at: new Date().toISOString(),
        })
        .eq("order_no", orderNo)

      // 更新产品库存和销量
      await supabase
        .from("products")
        .update({
          stock: product.stock - quantity,
          sales: (product.sales || 0) + quantity,
          product_info: remainingAccounts || null, // 移除已发放的账号
        })
        .eq("id", productId)

      console.log(`Order ${orderNo} completed and delivered`)
    } catch (err) {
      console.error("Error processing payment:", err)
      
      // 即使发放失败，也更新订单状态为已支付
      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
          buyer_email: session.customer_details?.email || null,
          buyer_name: session.customer_details?.name || null,
        })
        .eq("order_no", orderNo)
    }
  }

  // 处理支付失败事件
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderNo = session.metadata?.order_no

    if (orderNo) {
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("order_no", orderNo)
    }
  }

  return NextResponse.json({ received: true })
}
