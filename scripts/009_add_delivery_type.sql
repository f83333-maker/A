-- 为products表添加发货类型字段
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT '自动发货';

-- 将所有现有产品设置为自动发货
UPDATE products SET delivery_type = '自动发货' WHERE delivery_type IS NULL;
