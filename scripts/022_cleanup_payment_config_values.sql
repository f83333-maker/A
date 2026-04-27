-- 清理 payment_configs 表中已存储的转义字符和引号
UPDATE payment_configs 
SET 
  api_url = TRIM(BOTH '"' FROM api_url),
  merchant_id = TRIM(BOTH '"' FROM merchant_id),
  merchant_key = TRIM(BOTH '"' FROM merchant_key)
WHERE api_url IS NOT NULL OR merchant_id IS NOT NULL OR merchant_key IS NOT NULL;
