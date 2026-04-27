import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Checking if product_templates table exists...');
  
  const { data, error } = await supabase
    .from('product_templates')
    .select('id')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Table does not exist. Please run the following SQL in Supabase dashboard:');
    const sql = fs.readFileSync('scripts/create-product-templates-table.sql', 'utf8');
    console.log('\n' + sql);
  } else if (error) {
    console.log('Error checking table:', error.message);
  } else {
    console.log('Table product_templates already exists!');
  }
}

runMigration();
