-- 创建商品模板表
CREATE TABLE IF NOT EXISTS product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_templates_name ON product_templates(name);
CREATE INDEX IF NOT EXISTS idx_product_templates_created_at ON product_templates(created_at DESC);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_product_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_templates_updated_at ON product_templates;
CREATE TRIGGER trigger_update_product_templates_updated_at
  BEFORE UPDATE ON product_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_product_templates_updated_at();
