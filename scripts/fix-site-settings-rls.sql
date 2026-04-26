-- 修复 site_settings 表的 RLS 策略
-- 允许匿名用户读取和写入设置

-- 首先禁用 RLS（如果需要完全开放）
-- ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- 或者创建允许所有操作的策略
DROP POLICY IF EXISTS "允许所有人读取设置" ON site_settings;
DROP POLICY IF EXISTS "允许所有人写入设置" ON site_settings;
DROP POLICY IF EXISTS "允许所有人更新设置" ON site_settings;
DROP POLICY IF EXISTS "允许所有人删除设置" ON site_settings;

-- 启用 RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取
CREATE POLICY "允许所有人读取设置" ON site_settings
  FOR SELECT USING (true);

-- 创建策略：允许所有人插入
CREATE POLICY "允许所有人写入设置" ON site_settings
  FOR INSERT WITH CHECK (true);

-- 创建策略：允许所有人更新
CREATE POLICY "允许所有人更新设置" ON site_settings
  FOR UPDATE USING (true) WITH CHECK (true);

-- 创建策略：允许所有人删除
CREATE POLICY "允许所有人删除设置" ON site_settings
  FOR DELETE USING (true);

-- 验证表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'site_settings';
