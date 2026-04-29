-- 查询 orders 表的所有外键约束
SELECT constraint_name, table_name, column_name, referenced_table_name, referenced_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'orders' OR referenced_table_name = 'orders';

-- 查询所有引用 orders 表的外键
SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
       ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name,
       rc.update_rule, rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'orders' OR tc.table_name = 'orders';
