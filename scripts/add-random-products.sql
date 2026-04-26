-- 为每个分类添加20个随机产品
INSERT INTO products (id, category_id, name, description, price, original_price, stock, sales, tags, is_hot, is_active, product_info, cost_price, logo_bg_color, sort_order)
SELECT 
  gen_random_uuid(),
  cat_id,
  'Product ' || row_number,
  'Description for product ' || row_number,
  (RANDOM() * 1000 + 10)::numeric(10,2),
  (RANDOM() * 2000 + 50)::numeric(10,2),
  (RANDOM() * 500 + 10)::integer,
  (RANDOM() * 100)::integer,
  ARRAY['tag' || (RANDOM() * 5)::integer],
  RANDOM() > 0.7,
  true,
  'Product info ' || row_number,
  (RANDOM() * 500 + 5)::numeric(10,2),
  '#2d2e30',
  row_number
FROM (
  SELECT 
    UNNEST(ARRAY[
      '6c366e64-b9c8-474d-bd3e-8d26f1e1a573',
      'fb2e40eb-1abc-404d-9d9e-7b5f35a59b8f',
      '83caea47-e6ca-42e8-a8f9-ad6dc14a2c28',
      'a3f7c96f-f4ba-4ac1-9b3f-4fd62d0d77d8',
      '8ad8a2d0-3a26-4b62-ba64-b025f7bdfc21',
      '2a4f8b92-7c6f-4ff6-a8de-3c8c7b6e5f2a',
      '1b2c3d4e-5f6a-47b8-9c0d-1e2f3a4b5c6d',
      '9e8f7d6c-5b4a-3210-fedc-ba9876543210'
    ]) as cat_id,
    generate_series(1, 20) as row_number
) cross_cat;
