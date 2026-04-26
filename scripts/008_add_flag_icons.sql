-- 为products表添加icon_url字段（如果不存在）
ALTER TABLE products ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- 为Telegram产品添加国旗图标URL

-- 缅甸 +95
UPDATE products SET icon_url = 'https://flagcdn.com/w64/mm.png' 
WHERE name LIKE '%+95%' OR name LIKE '%95%' AND category_id IN (SELECT id FROM categories WHERE name LIKE '%Telegram%');

-- 贝宁 +229
UPDATE products SET icon_url = 'https://flagcdn.com/w64/bj.png' 
WHERE name LIKE '%贝宁%' OR name LIKE '%+229%';

-- 美国 +1
UPDATE products SET icon_url = 'https://flagcdn.com/w64/us.png' 
WHERE name LIKE '%美国%' OR name LIKE '%us美国%';

-- 哥伦比亚 +57
UPDATE products SET icon_url = 'https://flagcdn.com/w64/co.png' 
WHERE name LIKE '%哥伦比亚%' OR name LIKE '%+57%';

-- 孟加拉 +880
UPDATE products SET icon_url = 'https://flagcdn.com/w64/bd.png' 
WHERE name LIKE '%孟加拉%' OR name LIKE '%+880%';

-- 印度 +91
UPDATE products SET icon_url = 'https://flagcdn.com/w64/in.png' 
WHERE name LIKE '%印度+91%' OR (name LIKE '%印度%' AND name NOT LIKE '%印尼%');

-- 斯里兰卡 +94
UPDATE products SET icon_url = 'https://flagcdn.com/w64/lk.png' 
WHERE name LIKE '%斯里兰卡%' OR name LIKE '%+94%';

-- 印尼 +62
UPDATE products SET icon_url = 'https://flagcdn.com/w64/id.png' 
WHERE name LIKE '%印尼%' OR name LIKE '%+62%';

-- 尼日利亚 +234
UPDATE products SET icon_url = 'https://flagcdn.com/w64/ng.png' 
WHERE name LIKE '%尼日利亚%' OR name LIKE '%+234%';

-- 坦桑尼亚 +255
UPDATE products SET icon_url = 'https://flagcdn.com/w64/tz.png' 
WHERE name LIKE '%坦桑尼亚%' OR name LIKE '%+255%';

-- 埃及 +20
UPDATE products SET icon_url = 'https://flagcdn.com/w64/eg.png' 
WHERE name LIKE '%埃及%' OR name LIKE '%+20%';

-- 混合国家 - 使用地球图标
UPDATE products SET icon_url = 'https://flagcdn.com/w64/un.png' 
WHERE name LIKE '%混合国家%';
