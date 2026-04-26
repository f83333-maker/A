import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
  console.log('='.repeat(60))
  console.log('数据库重复数据检查报告')
  console.log('='.repeat(60))
  console.log('')

  // 检查 categories 表
  console.log('【分类表 (categories)】')
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (catError) {
    console.log(`  错误: ${catError.message}`)
  } else if (categories) {
    console.log(`  总数: ${categories.length} 条`)
    const catNames = categories.map(c => c.name)
    const duplicateCats = catNames.filter((name, index) => catNames.indexOf(name) !== index)
    if (duplicateCats.length > 0) {
      console.log(`  ⚠️ 发现重复分类名称: ${[...new Set(duplicateCats)].join(', ')}`)
      // 列出重复的具体记录
      const uniqueDups = [...new Set(duplicateCats)]
      for (const dupName of uniqueDups) {
        const dups = categories.filter(c => c.name === dupName)
        console.log(`    "${dupName}" 出现 ${dups.length} 次:`)
        dups.forEach(d => console.log(`      - ID: ${d.id}, 创建时间: ${d.created_at}`))
      }
    } else {
      console.log(`  ✓ 无重复`)
    }
  }
  console.log('')

  // 检查 products 表
  console.log('【产品表 (products)】')
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .order('name')
  
  if (prodError) {
    console.log(`  错误: ${prodError.message}`)
  } else if (products) {
    console.log(`  总数: ${products.length} 条`)
    const prodNames = products.map(p => p.name)
    const duplicateProds = prodNames.filter((name, index) => prodNames.indexOf(name) !== index)
    if (duplicateProds.length > 0) {
      console.log(`  ⚠️ 发现重复产品名称: ${[...new Set(duplicateProds)].join(', ')}`)
      const uniqueDups = [...new Set(duplicateProds)]
      for (const dupName of uniqueDups) {
        const dups = products.filter(p => p.name === dupName)
        console.log(`    "${dupName}" 出现 ${dups.length} 次:`)
        dups.forEach(d => console.log(`      - ID: ${d.id}, 价格: ${d.price}, 创建时间: ${d.created_at}`))
      }
    } else {
      console.log(`  ✓ 无重复`)
    }
  }
  console.log('')

  // 检查 announcements 表
  console.log('【公告表 (announcements)】')
  const { data: announcements, error: annError } = await supabase
    .from('announcements')
    .select('*')
    .order('title')
  
  if (annError) {
    console.log(`  错误: ${annError.message}`)
  } else if (announcements) {
    console.log(`  总数: ${announcements.length} 条`)
    const annTitles = announcements.map(a => a.title)
    const duplicateAnns = annTitles.filter((title, index) => annTitles.indexOf(title) !== index)
    if (duplicateAnns.length > 0) {
      console.log(`  ⚠️ 发现重复公告标题: ${[...new Set(duplicateAnns)].join(', ')}`)
      const uniqueDups = [...new Set(duplicateAnns)]
      for (const dupTitle of uniqueDups) {
        const dups = announcements.filter(a => a.title === dupTitle)
        console.log(`    "${dupTitle}" 出现 ${dups.length} 次:`)
        dups.forEach(d => console.log(`      - ID: ${d.id}, 创建时间: ${d.created_at}`))
      }
    } else {
      console.log(`  ✓ 无重复`)
    }
  }
  console.log('')

  // 检查 features 表
  console.log('【特性表 (features)】')
  const { data: features, error: featError } = await supabase
    .from('features')
    .select('*')
    .order('title')
  
  if (featError) {
    console.log(`  错误: ${featError.message}`)
  } else if (features) {
    console.log(`  总数: ${features.length} 条`)
    const featTitles = features.map(f => f.title)
    const duplicateFeats = featTitles.filter((title, index) => featTitles.indexOf(title) !== index)
    if (duplicateFeats.length > 0) {
      console.log(`  ⚠️ 发现重复特性标题: ${[...new Set(duplicateFeats)].join(', ')}`)
      const uniqueDups = [...new Set(duplicateFeats)]
      for (const dupTitle of uniqueDups) {
        const dups = features.filter(f => f.title === dupTitle)
        console.log(`    "${dupTitle}" 出现 ${dups.length} 次:`)
        dups.forEach(d => console.log(`      - ID: ${d.id}, 创建时间: ${d.created_at}`))
      }
    } else {
      console.log(`  ✓ 无重复`)
    }
  }
  console.log('')

  // 检查 admins 表
  console.log('【管理员表 (admins)】')
  const { data: admins, error: adminError } = await supabase
    .from('admins')
    .select('id, email, name, created_at')
    .order('email')
  
  if (adminError) {
    console.log(`  错误: ${adminError.message}`)
  } else if (admins) {
    console.log(`  总数: ${admins.length} 条`)
    const adminEmails = admins.map(a => a.email)
    const duplicateAdmins = adminEmails.filter((email, index) => adminEmails.indexOf(email) !== index)
    if (duplicateAdmins.length > 0) {
      console.log(`  ⚠️ 发现重复管理员邮箱: ${[...new Set(duplicateAdmins)].join(', ')}`)
    } else {
      console.log(`  ✓ 无重复`)
    }
    console.log(`  现有管理员:`)
    admins.forEach(a => console.log(`    - ${a.email} (${a.name || '无名称'})`))
  }
  console.log('')

  // 检查 site_settings 表
  console.log('【网站设置表 (site_settings)】')
  const { data: settings, error: setError } = await supabase
    .from('site_settings')
    .select('*')
    .order('key')
  
  if (setError) {
    // 尝试检查 settings 表
    const { data: oldSettings, error: oldSetError } = await supabase
      .from('settings')
      .select('*')
      .order('key')
    
    if (oldSetError) {
      console.log(`  site_settings 表: ${setError.message}`)
      console.log(`  settings 表: ${oldSetError.message}`)
    } else if (oldSettings) {
      console.log(`  注意: 使用的是旧表名 "settings"，建议重命名为 "site_settings"`)
      console.log(`  总数: ${oldSettings.length} 条`)
      const setKeys = oldSettings.map(s => s.key)
      const duplicateSets = setKeys.filter((key, index) => setKeys.indexOf(key) !== index)
      if (duplicateSets.length > 0) {
        console.log(`  ⚠️ 发现重复设置键: ${[...new Set(duplicateSets)].join(', ')}`)
      } else {
        console.log(`  ✓ 无重复`)
      }
    }
  } else if (settings) {
    console.log(`  总数: ${settings.length} 条`)
    const setKeys = settings.map(s => s.key)
    const duplicateSets = setKeys.filter((key, index) => setKeys.indexOf(key) !== index)
    if (duplicateSets.length > 0) {
      console.log(`  ⚠️ 发现重复设置键: ${[...new Set(duplicateSets)].join(', ')}`)
    } else {
      console.log(`  ✓ 无重复`)
    }
  }
  console.log('')

  // 检查 visitor_stats 表
  console.log('【访客统计表 (visitor_stats)】')
  const { data: visitors, error: visError } = await supabase
    .from('visitor_stats')
    .select('id')
    .limit(1)
  
  if (visError) {
    console.log(`  表不存在或无法访问: ${visError.message}`)
  } else {
    const { count } = await supabase
      .from('visitor_stats')
      .select('*', { count: 'exact', head: true })
    console.log(`  总数: ${count || 0} 条`)
    console.log(`  ✓ 访客记录允许重复（按访问记录）`)
  }
  
  console.log('')
  console.log('='.repeat(60))
  console.log('检查完成')
  console.log('='.repeat(60))
}

checkDuplicates().catch(console.error)
