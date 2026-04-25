import { createClient } from "@supabase/supabase-js"
import { generateSalt, hashPassword } from "../lib/crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function initAdmin() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const username = "b88889"
  const password = "b88889@88.com"
  
  console.log("正在生成超强加密密码...")
  console.log("使用 scrypt (N=131072, r=8, p=1) + SHA3-512")
  console.log("这可能需要几秒钟...")
  
  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  
  console.log("密码加密完成")
  console.log("盐值长度:", salt.length, "字符 (256位)")
  console.log("哈希长度:", passwordHash.length, "字符 (512位)")
  
  // 删除旧的管理员账号
  await supabase.from("admin_users").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  
  // 创建新管理员
  const { data, error } = await supabase
    .from("admin_users")
    .upsert({
      username,
      password_hash: passwordHash,
      password_salt: salt,
      last_login_at: new Date().toISOString(),
    }, {
      onConflict: "username"
    })
    .select()
  
  if (error) {
    console.error("创建管理员失败:", error)
    process.exit(1)
  }
  
  console.log("管理员账号创建成功!")
  console.log("用户名:", username)
  console.log("密码: [已加密存储]")
}

initAdmin().catch(console.error)
