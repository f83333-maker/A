import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 获取旧的易支付配置
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["epay_api_url", "epay_pid", "epay_key"])

    if (!settings || settings.length === 0) {
      return Response.json({ error: "未找到现有的易支付配置", code: "NO_CONFIG" }, { status: 400 })
    }

    const settingsMap: Record<string, string> = {}
    settings.forEach(item => {
      try {
        settingsMap[item.key] = JSON.parse(item.value)
      } catch {
        settingsMap[item.key] = item.value
      }
    })

    const apiUrl = settingsMap.epay_api_url
    const pid = settingsMap.epay_pid
    const key = settingsMap.epay_key

    if (!apiUrl || !pid || !key) {
      return Response.json({ error: "配置不完整", code: "INCOMPLETE_CONFIG" }, { status: 400 })
    }

    // 检查是否已存在相同配置
    const { data: existing } = await supabase
      .from("payment_configs")
      .select("id")
      .eq("type", "epay")
      .eq("merchant_id", pid)
      .limit(1)

    if (existing && existing.length > 0) {
      return Response.json({ 
        error: "该易支付配置已存在，请勿重复导入", 
        code: "ALREADY_EXISTS",
        configId: existing[0].id 
      }, { status: 400 })
    }

    // 创建新的支付配置
    const { data, error } = await supabase
      .from("payment_configs")
      .insert([
        {
          name: "易支付-主站",
          type: "epay",
          api_url: apiUrl,
          merchant_id: pid,
          merchant_key: key,
          supported_methods: ["wxpay", "alipay"],
          is_active: true,
          sort_order: 1,
        },
      ])
      .select()

    if (error) throw error

    return Response.json({
      success: true,
      message: "易支付配置已导入成功",
      config: data?.[0],
    })
  } catch (error) {
    console.error("同步易支付配置失败:", error)
    return Response.json(
      { error: "同步失败，请稍后重试", code: "SYNC_ERROR" },
      { status: 500 }
    )
  }
}
