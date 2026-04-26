-- 更新分类和产品数据
-- 全球社交媒体平台分类（不包括中国）

-- 先清空现有数据
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;

-- 插入新的分类
INSERT INTO categories (name, icon, description, color, sort_order, is_active) VALUES 
('Instagram账号', '📷', 'Instagram社交平台账号', '#E4405F', 1, true),
('Facebook账号', '📘', 'Facebook社交平台账号', '#1877F2', 2, true),
('Twitter X 账号', '🐦', 'Twitter/X社交平台账号', '#000000', 3, true),
('Gmail邮箱账号', '📧', 'Google Gmail邮箱账号', '#EA4335', 4, true),
('Youtube账号', '🎬', 'Youtube视频平台账号', '#FF0000', 5, true),
('Telegram账号', '✈️', 'Telegram即时通讯账号', '#0088CC', 6, true),
('Linkedin账号', '💼', 'Linkedin职业社交账号', '#0A66C2', 7, true),
('TikTok账号', '🎵', 'TikTok短视频平台账号', '#000000', 8, true),
('Discord账号', '🎮', 'Discord社区平台账号', '#5865F2', 9, true);

-- 插入Telegram分类下的产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT 
  c.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.stock,
  p.sales,
  p.is_hot,
  true
FROM categories c
CROSS JOIN (VALUES
  ('Telegram成品号-混合国家老号-双向号-API链接', 'Telegram双向号，混合国家老号，支持API链接', 158.39, 180.00, 49, 120, true),
  ('Telegram成品号-双向号(无法私信)混合国家-满月-网页登录-API接码', 'Telegram双向号，无法私信，混合国家满月号', 567.44, 650.00, 52, 85, false),
  ('Telegram成品号+95 API链接-满月号', 'Telegram +95区号满月号，支持API链接', 218.14, 250.00, 63, 95, true),
  ('Telegram成品号-网页登录(95账号)-直登API接码', 'Telegram 95账号网页登录，直登API接码', 619.12, 700.00, 24, 45, false),
  ('Telegram成品号混合国家老号 正常号 API链接', 'Telegram混合国家正常老号，支持API链接', 530.10, 600.00, 18, 65, true),
  ('Telegram成品号-贝宁+229 API链接-满月号', 'Telegram贝宁+229区号满月号', 509.58, 580.00, 47, 38, false),
  ('Telegram成品号-us美国+1 API链接-满月号', 'Telegram美国+1区号满月号', 408.71, 480.00, 15, 72, true),
  ('Telegram成品号-哥伦比亚+57 API链接-满月号', 'Telegram哥伦比亚+57区号满月号', 320.00, 380.00, 35, 28, false),
  ('Telegram成品号孟加拉+880 API链接-满月', 'Telegram孟加拉+880区号满月号', 280.00, 320.00, 42, 55, false),
  ('Telegram成品号印度+91-API链接-1~5月老号', 'Telegram印度+91区号1-5月老号', 450.00, 520.00, 28, 88, true),
  ('Telegram成品号斯里兰卡+94 API链接-满月号', 'Telegram斯里兰卡+94区号满月号', 380.00, 440.00, 33, 42, false),
  ('Telegram成品号+95 API链接 2~5个月-高质量', 'Telegram +95区号2-5月高质量号', 680.00, 780.00, 12, 35, true),
  ('Telegram成品号印尼+62 API链接-满月号', 'Telegram印尼+62区号满月号', 290.00, 340.00, 55, 68, false),
  ('Telegram成品号尼日利亚+234 API链接-满月号', 'Telegram尼日利亚+234区号满月号', 260.00, 300.00, 48, 45, false),
  ('Telegram成品号坦桑尼亚+255 API链接-满月号', 'Telegram坦桑尼亚+255区号满月号', 275.00, 320.00, 38, 32, false),
  ('Telegram成品号埃及+20 API链接-满月号', 'Telegram埃及+20区号满月号', 310.00, 360.00, 29, 48, false)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Telegram账号';

-- 插入其他分类的示例产品
-- Instagram产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Instagram老号-2019年注册-带头像帖子', 'Instagram 2019年老号，带头像和帖子', 128.00, 150.00, 35, 88, true),
  ('Instagram新号-邮箱注册-可换绑', 'Instagram新注册号，邮箱注册可换绑', 45.00, 55.00, 120, 210, false),
  ('Instagram蓝V认证号', 'Instagram蓝V认证账号', 1280.00, 1500.00, 5, 12, true),
  ('Instagram千粉老号-自然粉丝', 'Instagram千粉老号，自然真实粉丝', 380.00, 450.00, 18, 45, true),
  ('Instagram商业号-可投广告', 'Instagram商业账号，支持广告投放', 560.00, 650.00, 22, 38, false)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Instagram账号';

-- Facebook产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Facebook老号-2018年注册-美国IP', 'Facebook 2018年老号，美国IP注册', 168.00, 200.00, 42, 95, true),
  ('Facebook新号-邮箱验证-可换绑', 'Facebook新注册号，邮箱验证', 38.00, 48.00, 150, 280, false),
  ('Facebook BM商业号-可开户', 'Facebook BM商业账号，支持开户', 880.00, 1000.00, 8, 22, true),
  ('Facebook广告号-已过风控', 'Facebook广告账号，已过风控审核', 520.00, 600.00, 15, 48, true),
  ('Facebook千粉主页', 'Facebook千粉公共主页', 450.00, 520.00, 25, 55, false)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Facebook账号';

-- Twitter X 产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Twitter X 老号-2020年注册', 'Twitter X 2020年老号', 98.00, 120.00, 55, 125, true)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Twitter X 账号';

-- Gmail产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Gmail邮箱-美国IP注册-可改密', 'Gmail美国IP注册，支持改密', 25.00, 35.00, 200, 450, true),
  ('Gmail老邮箱-2019年-已验证', 'Gmail 2019年老邮箱，已验证', 68.00, 80.00, 85, 180, false)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Gmail邮箱账号';

-- Youtube产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Youtube频道号-可开启获利', 'Youtube频道账号，满足获利条件', 1500.00, 1800.00, 6, 15, true)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Youtube账号';

-- Linkedin产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Linkedin老号-500+人脉', 'Linkedin老号，500+职业人脉', 280.00, 350.00, 22, 48, true)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Linkedin账号';

-- TikTok产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('TikTok老号-美区-可直播', 'TikTok美区老号，支持直播功能', 420.00, 500.00, 18, 65, true)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'TikTok账号';

-- Discord产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, is_hot, is_active)
SELECT c.id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.is_hot, true
FROM categories c
CROSS JOIN (VALUES
  ('Discord老号-2020年注册-已验证', 'Discord 2020年老号，邮箱已验证', 58.00, 70.00, 68, 125, true)
) AS p(name, description, price, original_price, stock, sales, is_hot)
WHERE c.name = 'Discord账号';
