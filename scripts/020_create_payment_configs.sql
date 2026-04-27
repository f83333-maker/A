-- 创建支付配置表
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                    -- 支付配置名称，如"易支付-主站"
  type VARCHAR(50) NOT NULL DEFAULT 'epay',      -- 支付类型：epay, alipay_direct, wxpay_native 等
  api_url VARCHAR(500),                          -- API接口地址
  merchant_id VARCHAR(100),                      -- 商户ID/PID
  merchant_key VARCHAR(500),                     -- 商户密钥
  extra_config JSONB DEFAULT '{}',               -- 额外配置（如公钥、私钥等）
  supported_methods TEXT[] DEFAULT ARRAY['wxpay', 'alipay'], -- 支持的支付方式
  is_active BOOLEAN DEFAULT true,                -- 是否启用
  sort_order INTEGER DEFAULT 0,                  -- 排序
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_configs_active ON payment_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_configs_sort ON payment_configs(sort_order);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_configs_updated_at ON payment_configs;
CREATE TRIGGER trigger_payment_configs_updated_at
  BEFORE UPDATE ON payment_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_configs_updated_at();

-- 迁移现有易支付配置到新表（如果有的话）
INSERT INTO payment_configs (name, type, api_url, merchant_id, merchant_key, supported_methods, is_active, sort_order)
SELECT 
  '易支付（默认）' as name,
  'epay' as type,
  (SELECT value FROM site_settings WHERE key = 'epay_api_url' LIMIT 1)::text as api_url,
  (SELECT value FROM site_settings WHERE key = 'epay_pid' LIMIT 1)::text as merchant_id,
  (SELECT value FROM site_settings WHERE key = 'epay_key' LIMIT 1)::text as merchant_key,
  ARRAY['wxpay', 'alipay'] as supported_methods,
  true as is_active,
  0 as sort_order
WHERE EXISTS (SELECT 1 FROM site_settings WHERE key = 'epay_api_url' AND value IS NOT NULL AND value != '""')
ON CONFLICT DO NOTHING;
