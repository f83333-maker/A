-- 添加 tag_label 和 icon_url 列到 products 表
ALTER TABLE products ADD COLUMN IF NOT EXISTS tag_label TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS icon_url TEXT;
