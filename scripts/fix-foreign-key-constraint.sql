-- 修改 orders 表的外键约束，允许产品和订单独立删除
-- 当产品被删除时，订单的 product_id 会被设置为 NULL，而不是阻止删除

-- 1. 首先删除现有的外键约束
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

-- 2. 确保 product_id 列允许 NULL 值
ALTER TABLE orders ALTER COLUMN product_id DROP NOT NULL;

-- 3. 重新添加外键约束，使用 ON DELETE SET NULL
-- 这样删除产品时，相关订单的 product_id 会被设置为 NULL
ALTER TABLE orders 
ADD CONSTRAINT orders_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- 完成！现在可以独立删除产品或订单了
