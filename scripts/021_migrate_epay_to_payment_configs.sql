-- 从 site_settings 表迁移现有易支付配置到 payment_configs 表

INSERT INTO payment_configs (
  id,
  name,
  type,
  api_url,
  merchant_id,
  merchant_key,
  extra_config,
  supported_methods,
  is_active,
  sort_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '易支付-主配置',
  'epay',
  COALESCE(
    (SELECT value FROM site_settings WHERE key = 'epay_api_url' LIMIT 1)::text,
    ''
  ),
  COALESCE(
    (SELECT value FROM site_settings WHERE key = 'epay_pid' LIMIT 1)::text,
    ''
  ),
  COALESCE(
    (SELECT value FROM site_settings WHERE key = 'epay_key' LIMIT 1)::text,
    ''
  ),
  '{}',
  ARRAY['wxpay', 'alipay'],
  true,
  1,
  now(),
  now()
WHERE NOT EXISTS (
  -- 检查是否已经存在同名配置，避免重复
  SELECT 1 FROM payment_configs WHERE name = '易支付-主配置'
)
AND EXISTS (
  -- 检查是否有有效的易支付配置
  SELECT 1 FROM site_settings 
  WHERE key IN ('epay_api_url', 'epay_pid', 'epay_key')
  LIMIT 1
);
