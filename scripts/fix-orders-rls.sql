-- 检查 orders 表是否启用了 RLS
SELECT * FROM pg_catalog.pg_class 
WHERE relname = 'orders' AND relrowsecurity = true;

-- 检查 orders 表的所有 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- 禁用 orders 表的 RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 或者添加允许 DELETE 的 RLS 策略
CREATE POLICY "Allow delete for service role" ON orders
FOR DELETE USING (auth.role() = 'service_role');
