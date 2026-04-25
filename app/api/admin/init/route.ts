import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSalt, hashPassword } from "@/lib/crypto"

// 这个 API 只能运行一次，用于初始化管理员账号
// 初始化后应该删除这个文件或禁用

export async function POST(request: Request) {
  try {
    // 验证初始化密钥（防止任何人都能调用）
    const { initKey } = await request.json()
    
    if (initKey !== "INIT_ADMIN_2024_SECURE") {
      return NextResponse.json({ error: "无效的初始化密钥" }, { status: 403 })
    }
    
    const supabase = await createClient()
    
    const username = "b88889"
    const password = "b88889@88.com"
    
    // 生成超强加密
    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)
    
    // 删除所有旧管理员
    await supabase.from("admin_users").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    
    // 创建新管理员
    const { error } = await supabase
      .from("admin_users")
      .insert({
        username,
        password_hash: passwordHash,
        password_salt: salt,
        last_login_at: new Date().toISOString(),
      })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "管理员账号已创建",
      encryption: "scrypt (N=131072) + SHA3-512",
      saltBits: 256,
      hashBits: 512
    })
  } catch (error) {
    return NextResponse.json({ error: "初始化失败" }, { status: 500 })
  }
}
