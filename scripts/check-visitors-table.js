import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pqwxxpekxupxhbakcfpi.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("检查 visitor_stats 表...")

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  // 检查表是否存在
  const { data, error } = await supabase
    .from("visitor_stats")
    .select("*")
    .limit(5)
  
  if (error) {
    console.log("visitor_stats 表不存在或无法访问:", error.message)
    console.log("\n请在 Supabase SQL 编辑器中执行以下 SQL 创建表：")
    console.log(`
-- 创建访客统计表
CREATE TABLE IF NOT EXISTS visitor_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  ip_location TEXT DEFAULT '未知',
  device_type VARCHAR(50),
  device_info TEXT,
  user_agent TEXT,
  page_url TEXT,
  viewed_products TEXT[] DEFAULT '{}',
  order_no VARCHAR(100),
  session_id VARCHAR(255),
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_visitor_stats_visited_at ON visitor_stats(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_stats_ip ON visitor_stats(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_stats_session ON visitor_stats(session_id);

-- 启用 RLS
ALTER TABLE visitor_stats ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人插入
CREATE POLICY "允许插入访客记录" ON visitor_stats FOR INSERT WITH CHECK (true);

-- 创建策略：允许所有人查看
CREATE POLICY "允许查看访客记录" ON visitor_stats FOR SELECT USING (true);

-- 创建策略：允许更新
CREATE POLICY "允许更新访客记录" ON visitor_stats FOR UPDATE USING (true) WITH CHECK (true);
    `)
    return
  }
  
  console.log("visitor_stats 表存在！")
  console.log("当前记录数:", data.length)
  
  if (data.length > 0) {
    console.log("\n最近的访客记录:")
    data.forEach((v, i) => {
      console.log(`${i + 1}. IP: ${v.ip_address}, 地区: ${v.ip_location || '未知'}, 设备: ${v.device_type}, 时间: ${v.visited_at}`)
    })
  }
}

checkTable().catch(console.error)
