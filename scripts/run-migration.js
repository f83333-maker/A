import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  try {
    // 添加 epay_trade_no 字段
    const { error: err1 } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS epay_trade_no TEXT"
    }).catch(() => ({ error: null }))
    
    // 添加 user_trade_no 字段
    const { error: err2 } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_trade_no TEXT"
    }).catch(() => ({ error: null }))

    // 直接尝试添加列（Supabase 会忽略已存在的列错误）
    console.log("尝试通过 REST API 添加字段...")
    
    // 测试查询
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_no, epay_trade_no, user_trade_no")
      .limit(1)
    
    if (error) {
      console.log("字段可能不存在，需要手动添加:", error.message)
    } else {
      console.log("字段已存在，迁移完成")
    }
  } catch (e) {
    console.error("迁移失败:", e)
  }
}

run()
