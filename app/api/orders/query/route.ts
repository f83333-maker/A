import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderNo = searchParams.get("orderNo")

  if (!orderNo) {
    return NextResponse.json({ success: false, error: "订单号不能为空" })
  }

  try {
    const supabase = await createClient()
    
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single()

    if (error || !order) {
      return NextResponse.json({ success: false, error: "未找到该订单" })
    }

    return NextResponse.json({ success: true, order })
  } catch {
    return NextResponse.json({ success: false, error: "查询失败，请稍后重试" })
  }
}
