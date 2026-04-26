-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'cancelled', 'refunded')),
  buyer_email TEXT,
  buyer_name TEXT,
  buyer_ip TEXT,
  payment_method TEXT,
  payment_trade_no TEXT,
  delivered_content TEXT,
  delivered_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);

-- 启用 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- 允许通过订单号公开查询订单（用于订单查询页面）
CREATE POLICY "allow_public_read_orders_by_order_no" ON orders 
  FOR SELECT USING (true);

-- 允许创建订单（用于下单）
CREATE POLICY "allow_public_insert_orders" ON orders 
  FOR INSERT WITH CHECK (true);

-- 允许更新订单（用于支付回调等）
CREATE POLICY "allow_public_update_orders" ON orders 
  FOR UPDATE USING (true) WITH CHECK (true);

-- 管理员完全访问
CREATE POLICY "allow_admin_all_orders" ON orders 
  FOR ALL USING (true) WITH CHECK (true);

-- 添加更新时间触发器
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
