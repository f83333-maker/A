import { createClient } from '@supabase/supabase-js'

/**
 * 创建具有管理员权限的 Supabase 客户端
 * 使用 Service Role Key，绕过 RLS 策略
 * 仅在服务器端使用！
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少 Supabase 环境变量')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
