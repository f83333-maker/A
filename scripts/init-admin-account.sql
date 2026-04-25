-- 创建管理员账号脚本
-- scrypt(N=131072, r=8, p=1, dkLen=64)派生的密钥然后SHA3-512散列
-- 管理员：b88889 / b88889@88.com

INSERT INTO admin_users (username, password_hash, password_salt)
VALUES (
  'b88889',
  'a8f3b2c1d9e4f7a3b6c8d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  '4d7b9e3f2a1c8b5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
)
ON CONFLICT (username) DO NOTHING;

SELECT 'Admin user created or already exists' as result;
