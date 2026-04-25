import { createClient } from "@supabase/supabase-js"
import { scrypt } from "@noble/hashes/scrypt"
import { randomBytes } from "crypto"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function createAdmin() {
  const username = "b88889"
  const password = "b88889@88.com"
  const salt = randomBytes(32).toString("hex")
  
  // 使用 scrypt 派生密钥
  const derivedKey = scrypt(password, salt, { N: 131072, r: 8, p: 1, dkLen: 64 })
  const passwordHash = Buffer.from(derivedKey).toString("hex")
  
  // 验证管理员是否已存在
  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .eq("username", username)
    .single()
  
  if (existing) {
    console.log("✓ 管理员账号已存在")
    return
  }
  
  // 创建新管理员
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      username,
      password_hash: passwordHash,
      password_salt: salt,
    })
    .select()
    .single()
  
  if (error) {
    console.error("创建管理员失败:", error)
    process.exit(1)
  }
  
  console.log("✓ 管理员账号创建成功")
  console.log(`  用户名: ${username}`)
  console.log(`  密码: ${password}`)
  console.log(`  ID: ${data.id}`)
}

createAdmin().catch(console.error)
