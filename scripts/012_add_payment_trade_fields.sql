-- 添加支付交易相关字段到订单表
-- 商户订单号 order_no 已存在（ZH开头）

-- 添加易支付系统订单号字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'epay_trade_no') THEN
    ALTER TABLE orders ADD COLUMN epay_trade_no TEXT;
    COMMENT ON COLUMN orders.epay_trade_no IS '易支付系统订单号';
  END IF;
END $$;

-- 添加用户交易单号字段（微信/支付宝真实交易号）
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_trade_no') THEN
    ALTER TABLE orders ADD COLUMN user_trade_no TEXT;
    COMMENT ON COLUMN orders.user_trade_no IS '用户交易单号（微信/支付宝真实交易号）';
  END IF;
END $$;

-- 将现有 stripe_payment_intent_id 数据迁移到 epay_trade_no
UPDATE orders SET epay_trade_no = stripe_payment_intent_id WHERE stripe_payment_intent_id IS NOT NULL AND epay_trade_no IS NULL;

-- 创建索引以支持订单查询
CREATE INDEX IF NOT EXISTS idx_orders_epay_trade_no ON orders(epay_trade_no);
CREATE INDEX IF NOT EXISTS idx_orders_user_trade_no ON orders(user_trade_no);
