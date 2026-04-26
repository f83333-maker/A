import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pqwxxpekxupxhbakcfpi.supabase.co"
const supabaseKey = "sb_secret_MWdKIQOLHTeivTnvmiqX-w_HCjPxkjF"

const supabase = createClient(supabaseUrl, supabaseKey)

async function createVisitorsTable() {
  console.log("创建访客记录表...")
  
  // 使用 Supabase 的 REST API 执行 SQL
  // 由于 anon key 权限限制，我们尝试直接插入一条记录来测试表是否存在
  // 如果表不存在，需要在 Supabase 控制台手动创建
  
  console.log(`
请在 Supabase 控制台的 SQL 编辑器中执行以下 SQL：

-- 创建访客记录表
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address VARCHAR(45),
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitors_session ON visitors(session_id);

-- 启用 RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- 创建策略允许插入
CREATE POLICY "允许所有人插入访客记录" ON visitors
  FOR INSERT WITH CHECK (true);

-- 创建策略允许管理员查看
CREATE POLICY "允许查看访客记录" ON visitors
  FOR SELECT USING (true);

---

同时，请确保在网站设置中配置易支付信息：
1. 进入后台 -> 网站设置 -> 支付设置
2. 填写易支付 API 地址 (如: https://pay.example.com)
3. 填写商户 ID (PID)
4. 填写商户密钥 (Key)
`)
}

createVisitorsTable()
