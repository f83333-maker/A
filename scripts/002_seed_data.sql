-- 插入默认管理员 (密码: admin123，使用bcrypt哈希)
-- 注意：实际生产环境中请更改密码
INSERT INTO admins (email, password_hash, name) VALUES 
('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBrkHx3ih4cZDRvjM7MqGGfDEKO', '超级管理员')
ON CONFLICT (email) DO NOTHING;

-- 插入默认分类
INSERT INTO categories (name, icon, description, color, sort_order) VALUES 
('社交媒体', '👥', '各类社交平台账号', '#8ab4f8', 1),
('邮箱账号', '📧', '各类邮箱服务账号', '#81c995', 2),
('视频平台', '🎬', '视频网站会员账号', '#fdd663', 3),
('通讯工具', '💬', '即时通讯软件账号', '#ee675c', 4),
('电商平台', '🛒', '电商购物平台账号', '#af87c9', 5),
('海外服务', '🌍', '海外平台服务账号', '#8ab4f8', 6),
('游戏账号', '📱', '各类游戏平台账号', '#81c995', 7),
('其他账号', '✨', '其他类型账号服务', '#fdd663', 8);

-- 插入默认产品
INSERT INTO products (category_id, name, description, price, original_price, stock, sales, tags, is_hot, product_info) 
SELECT 
  c.id,
  '示例产品 - ' || c.name,
  '这是' || c.name || '分类下的示例产品',
  9.99,
  19.99,
  100,
  50,
  ARRAY['热销', '推荐'],
  true,
  '产品详细介绍信息，登录后查看详情。'
FROM categories c;

-- 插入默认公告
INSERT INTO announcements (title, content, is_new) VALUES 
('欢迎使用本平台', '感谢您选择我们的服务，我们将为您提供最优质的账号服务。', true),
('新品上架通知', '本周新上架多款热门账号，欢迎选购。', true),
('售后服务升级', '我们的售后服务已全面升级，7x24小时在线为您解答疑问。', false);

-- 插入默认特性
INSERT INTO features (icon, title, description, color, sort_order) VALUES 
('🛡️', '安全保障', '多重验证机制，确保交易安全', '#ee675c', 1),
('⚡', '即时发货', '自动化系统，秒级交付体验', '#fdd663', 2),
('🕐', '全天服务', '7×24小时在线，随时解答疑问', '#81c995', 3),
('❤️', '售后无忧', '完善售后体系，保障您的权益', '#ee675c', 4);

-- 插入默认设置
INSERT INTO settings (key, value) VALUES 
('site_name', '"账号批发平台"'),
('site_description', '"专业的账号批发服务平台"'),
('contact_email', '"support@example.com"'),
('payment_methods', '["USDT-TRC20", "TRON-TRX", "微信(费率8%)", "支付宝(费率8%)", "微信(备用)", "支付宝(备用)"]')
ON CONFLICT (key) DO NOTHING;
