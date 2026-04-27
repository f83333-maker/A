import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 获取前台可用的支付方式（已启用的支付配置汇总）
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: configs, error } = await supabase
      .from("payment_configs")
      .select("id, name, type, supported_methods, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    
    if (error) throw error
    
    // 汇总所有启用的支付方式
    const methodsMap = new Map<string, { id: string; name: string; configId: string; configName: string }>()
    
    for (const config of configs || []) {
      for (const method of config.supported_methods || []) {
        if (!methodsMap.has(method)) {
          methodsMap.set(method, {
            id: method,
            name: method === "wxpay" ? "微信支付" : method === "alipay" ? "支付宝" : method,
            configId: config.id,
            configName: config.name,
          })
        }
      }
    }
    
    const methods = Array.from(methodsMap.values())
    
    return NextResponse.json({
      methods,
      configs: configs?.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        supportedMethods: c.supported_methods,
      })) || [],
    })
  } catch (error) {
    console.error("获取支付方式失败:", error)
    // 返回默认的支付方式（兼容旧版）
    return NextResponse.json({
      methods: [
        { id: "wxpay", name: "微信支付", configId: null, configName: "默认" },
        { id: "alipay", name: "支付宝", configId: null, configName: "默认" },
      ],
      configs: [],
    })
  }
}
