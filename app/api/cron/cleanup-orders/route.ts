import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * 定时清理订单 API
 * 
 * 功能：检查管理员最后登录时间，如果超过15天未登录后台，
 * 则彻底删除所有订单数据（不可恢复）
 * 
 * 配置 Vercel Cron Job:
 * 在 vercel.json 中添加:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-orders",
 *     "schedule": "0 0 * * *"  // 每天午夜执行
 *   }]
 * }
 */

const INACTIVE_DAYS_THRESHOLD = 15

export async function GET(request: Request) {
  try {
    // 验证 Cron 密钥（防止任意调用）
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    // 如果设置了 CRON_SECRET，则验证
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // 也允许 Vercel Cron 调用
      const isVercelCron = request.headers.get("x-vercel-cron") === "true"
      if (!isVercelCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const supabase = await createClient()

    // 获取所有管理员的最后登录时间
    const { data: admins, error: adminError } = await supabase
      .from("admin_users")
      .select("id, username, last_login_at")
      .order("last_login_at", { ascending: false })
      .limit(1)

    if (adminError || !admins || admins.length === 0) {
      return NextResponse.json({ 
        message: "没有管理员账号",
        ordersDeleted: false 
      })
    }

    const latestAdmin = admins[0]
    const lastLoginAt = latestAdmin.last_login_at 
      ? new Date(latestAdmin.last_login_at) 
      : new Date(0)
    
    const now = new Date()
    const daysSinceLastLogin = Math.floor(
      (now.getTime() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    console.log(`[Cleanup] 最后登录时间: ${lastLoginAt.toISOString()}`)
    console.log(`[Cleanup] 距今天数: ${daysSinceLastLogin}`)
    console.log(`[Cleanup] 阈值: ${INACTIVE_DAYS_THRESHOLD} 天`)

    if (daysSinceLastLogin >= INACTIVE_DAYS_THRESHOLD) {
      console.log(`[Cleanup] 超过 ${INACTIVE_DAYS_THRESHOLD} 天未登录，开始删除所有订单...`)
      
      // 彻底删除所有订单（使用 TRUNCATE 级别的删除）
      // 1. 先获取订单数量
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
      
      // 2. 删除所有订单
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // 删除所有记录的技巧
      
      if (deleteError) {
        console.error("[Cleanup] 删除订单失败:", deleteError)
        return NextResponse.json({ 
          error: "删除订单失败",
          details: deleteError.message 
        }, { status: 500 })
      }

      // 3. 记录删除日志（可选：存到单独的审计表）
      console.log(`[Cleanup] 已删除 ${orderCount || 0} 条订单`)

      return NextResponse.json({
        success: true,
        message: `管理员已 ${daysSinceLastLogin} 天未登录，已删除所有订单`,
        ordersDeleted: true,
        deletedCount: orderCount || 0,
        lastLoginAt: lastLoginAt.toISOString(),
        deletedAt: now.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: `管理员在 ${daysSinceLastLogin} 天前登录过，无需清理`,
      ordersDeleted: false,
      daysSinceLastLogin,
      daysUntilCleanup: INACTIVE_DAYS_THRESHOLD - daysSinceLastLogin,
      lastLoginAt: lastLoginAt.toISOString(),
    })

  } catch (error) {
    console.error("[Cleanup] 执行出错:", error)
    return NextResponse.json({ 
      error: "执行失败",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
