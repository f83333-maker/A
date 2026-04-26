-- 修复表名问题：将 settings 表重命名为 site_settings
-- 如果 settings 表存在，重命名为 site_settings
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings') THEN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'site_settings') THEN
      ALTER TABLE settings RENAME TO site_settings;
    ELSE
      -- 如果两个表都存在，迁移数据后删除旧表
      INSERT INTO site_settings (id, key, value, created_at, updated_at)
      SELECT id, key, value, created_at, updated_at FROM settings
      ON CONFLICT (key) DO NOTHING;
      DROP TABLE settings;
    END IF;
  END IF;
END $$;

-- 如果 site_settings 表不存在，创建它
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建访客统计表
CREATE TABLE IF NOT EXISTS visitor_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  page_url TEXT,
  device_type TEXT,
  device_info TEXT,
  ip_location TEXT DEFAULT '未知',
  session_id TEXT,
  viewed_products UUID[] DEFAULT '{}',
  order_no TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_visitor_stats_ip ON visitor_stats(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_stats_visited_at ON visitor_stats(visited_at);
CREATE INDEX IF NOT EXISTS idx_visitor_stats_session ON visitor_stats(session_id);

-- 启用 RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_stats ENABLE ROW LEVEL SECURITY;

-- site_settings 的 RLS 策略（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'allow_public_read_site_settings') THEN
    CREATE POLICY "allow_public_read_site_settings" ON site_settings FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'allow_admin_all_site_settings') THEN
    CREATE POLICY "allow_admin_all_site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- visitor_stats 的 RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'allow_public_insert_visitor_stats') THEN
    CREATE POLICY "allow_public_insert_visitor_stats" ON visitor_stats FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'allow_public_select_visitor_stats') THEN
    CREATE POLICY "allow_public_select_visitor_stats" ON visitor_stats FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'allow_public_update_visitor_stats') THEN
    CREATE POLICY "allow_public_update_visitor_stats" ON visitor_stats FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 添加 site_settings 的更新时间触发器
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_settings_updated_at') THEN
    CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 插入默认设置（如果不存在）
INSERT INTO site_settings (key, value) VALUES 
('site_name', '"账号批发平台"'),
('site_description', '"专业的账号批发服务平台"'),
('contact_email', '"support@example.com"'),
('payment_methods', '["USDT-TRC20", "TRON-TRX", "微信(费率8%)", "支付宝(费率8%)", "微信(备用)", "支付宝(备用)"]')
ON CONFLICT (key) DO NOTHING;
