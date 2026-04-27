import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// 使用 Service Role Key 创建管理员客户端
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// 初始化模板表
export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // 检查表是否存在
    const { error: checkError } = await supabase
      .from("product_templates")
      .select("id")
      .limit(1)

    if (checkError && checkError.code === "42P01") {
      // 表不存在，返回创建SQL
      return NextResponse.json({ 
        exists: false,
        message: "Table does not exist. Please create it in Supabase dashboard.",
        sql: `
CREATE TABLE IF NOT EXISTS product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_templates_name ON product_templates(name);
CREATE INDEX IF NOT EXISTS idx_product_templates_created_at ON product_templates(created_at DESC);
        `.trim()
      })
    }

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    return NextResponse.json({ exists: true, message: "Table already exists" })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
