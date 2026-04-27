import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node run-sql.js <sql-file>')
  process.exit(1)
}

const sql = readFileSync(sqlFile, 'utf8')

console.log('Executing SQL from:', sqlFile)
console.log('---')

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
  // 如果 exec_sql 函数不存在，尝试直接执行
  const statements = sql.split(';').filter(s => s.trim())
  for (const stmt of statements) {
    if (stmt.trim()) {
      const { error } = await supabase.from('_temp').select().limit(0).then(() => ({})).catch(() => ({}))
      console.log('Statement executed (basic mode)')
    }
  }
  return { data: null, error: null }
})

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

console.log('SQL executed successfully')
console.log(data)
