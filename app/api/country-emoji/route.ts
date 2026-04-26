import { NextResponse } from "next/server"

// 国家名称到emoji的映射（包含中文、英文和常见变体）
const countryEmojis: Record<string, { emoji: string; names: string[] }> = {
  AF: { emoji: "🇦🇫", names: ["afghanistan", "阿富汗"] },
  AL: { emoji: "🇦🇱", names: ["albania", "阿尔巴尼亚"] },
  DZ: { emoji: "🇩🇿", names: ["algeria", "阿尔及利亚"] },
  AD: { emoji: "🇦🇩", names: ["andorra", "安道尔"] },
  AO: { emoji: "🇦🇴", names: ["angola", "安哥拉"] },
  AR: { emoji: "🇦🇷", names: ["argentina", "阿根廷"] },
  AM: { emoji: "🇦🇲", names: ["armenia", "亚美尼亚"] },
  AU: { emoji: "🇦🇺", names: ["australia", "澳大利亚", "澳洲"] },
  AT: { emoji: "🇦🇹", names: ["austria", "奥地利"] },
  AZ: { emoji: "🇦🇿", names: ["azerbaijan", "阿塞拜疆"] },
  BH: { emoji: "🇧🇭", names: ["bahrain", "巴林"] },
  BD: { emoji: "🇧🇩", names: ["bangladesh", "孟加拉", "孟加拉国", "+880"] },
  BY: { emoji: "🇧🇾", names: ["belarus", "白俄罗斯"] },
  BE: { emoji: "🇧🇪", names: ["belgium", "比利时"] },
  BJ: { emoji: "🇧🇯", names: ["benin", "贝宁", "+229"] },
  BT: { emoji: "🇧🇹", names: ["bhutan", "不丹"] },
  BO: { emoji: "🇧🇴", names: ["bolivia", "玻利维亚"] },
  BA: { emoji: "🇧🇦", names: ["bosnia", "波斯尼亚", "波黑"] },
  BW: { emoji: "🇧🇼", names: ["botswana", "博茨瓦纳"] },
  BR: { emoji: "🇧🇷", names: ["brazil", "巴西"] },
  BN: { emoji: "🇧🇳", names: ["brunei", "文莱"] },
  BG: { emoji: "🇧🇬", names: ["bulgaria", "保加利亚"] },
  KH: { emoji: "🇰🇭", names: ["cambodia", "柬埔寨"] },
  CM: { emoji: "🇨🇲", names: ["cameroon", "喀麦隆"] },
  CA: { emoji: "🇨🇦", names: ["canada", "加拿大"] },
  CL: { emoji: "🇨🇱", names: ["chile", "智利"] },
  CN: { emoji: "🇨🇳", names: ["china", "中国", "中华人民共和国"] },
  CO: { emoji: "🇨🇴", names: ["colombia", "哥伦比亚", "+57"] },
  CR: { emoji: "🇨🇷", names: ["costa rica", "哥斯达黎加"] },
  HR: { emoji: "🇭🇷", names: ["croatia", "克罗地亚"] },
  CU: { emoji: "🇨🇺", names: ["cuba", "古巴"] },
  CY: { emoji: "🇨🇾", names: ["cyprus", "塞浦路斯"] },
  CZ: { emoji: "🇨🇿", names: ["czech", "捷克"] },
  DK: { emoji: "🇩🇰", names: ["denmark", "丹麦"] },
  EC: { emoji: "🇪🇨", names: ["ecuador", "厄瓜多尔"] },
  EG: { emoji: "🇪🇬", names: ["egypt", "埃及", "+20"] },
  SV: { emoji: "🇸🇻", names: ["el salvador", "萨尔瓦多"] },
  EE: { emoji: "🇪🇪", names: ["estonia", "爱沙尼亚"] },
  ET: { emoji: "🇪🇹", names: ["ethiopia", "埃塞俄比亚"] },
  FI: { emoji: "🇫🇮", names: ["finland", "芬兰"] },
  FR: { emoji: "🇫🇷", names: ["france", "法国"] },
  DE: { emoji: "🇩🇪", names: ["germany", "德国"] },
  GH: { emoji: "🇬🇭", names: ["ghana", "加纳"] },
  GR: { emoji: "🇬🇷", names: ["greece", "希腊"] },
  GT: { emoji: "🇬🇹", names: ["guatemala", "危地马拉"] },
  HK: { emoji: "🇭🇰", names: ["hong kong", "香港"] },
  HU: { emoji: "🇭🇺", names: ["hungary", "匈牙利"] },
  IS: { emoji: "🇮🇸", names: ["iceland", "冰岛"] },
  IN: { emoji: "🇮🇳", names: ["india", "印度", "+91"] },
  ID: { emoji: "🇮🇩", names: ["indonesia", "印尼", "印度尼西亚", "+62"] },
  IR: { emoji: "🇮🇷", names: ["iran", "伊朗"] },
  IQ: { emoji: "🇮🇶", names: ["iraq", "伊拉克"] },
  IE: { emoji: "🇮🇪", names: ["ireland", "爱尔兰"] },
  IL: { emoji: "🇮🇱", names: ["israel", "以色列"] },
  IT: { emoji: "🇮🇹", names: ["italy", "意大利"] },
  JP: { emoji: "🇯🇵", names: ["japan", "日本"] },
  JO: { emoji: "🇯🇴", names: ["jordan", "约旦"] },
  KZ: { emoji: "🇰🇿", names: ["kazakhstan", "哈萨克斯坦"] },
  KE: { emoji: "🇰🇪", names: ["kenya", "肯尼亚"] },
  KP: { emoji: "🇰🇵", names: ["north korea", "朝鲜"] },
  KR: { emoji: "🇰🇷", names: ["south korea", "韩国"] },
  KW: { emoji: "🇰🇼", names: ["kuwait", "科威特"] },
  LA: { emoji: "🇱🇦", names: ["laos", "老挝"] },
  LV: { emoji: "🇱🇻", names: ["latvia", "拉脱维亚"] },
  LB: { emoji: "🇱🇧", names: ["lebanon", "黎巴嫩"] },
  LY: { emoji: "🇱🇾", names: ["libya", "利比亚"] },
  LT: { emoji: "🇱🇹", names: ["lithuania", "立陶宛"] },
  LU: { emoji: "🇱🇺", names: ["luxembourg", "卢森堡"] },
  MO: { emoji: "🇲🇴", names: ["macau", "澳门"] },
  MY: { emoji: "🇲🇾", names: ["malaysia", "马来西亚", "大马"] },
  MV: { emoji: "🇲🇻", names: ["maldives", "马尔代夫"] },
  MX: { emoji: "🇲🇽", names: ["mexico", "墨西哥"] },
  MN: { emoji: "🇲🇳", names: ["mongolia", "蒙古"] },
  MA: { emoji: "🇲🇦", names: ["morocco", "摩洛哥"] },
  MM: { emoji: "🇲🇲", names: ["myanmar", "缅甸", "+95"] },
  NP: { emoji: "🇳🇵", names: ["nepal", "尼泊尔"] },
  NL: { emoji: "🇳🇱", names: ["netherlands", "荷兰"] },
  NZ: { emoji: "🇳🇿", names: ["new zealand", "新西兰"] },
  NG: { emoji: "🇳🇬", names: ["nigeria", "尼日利亚", "+234"] },
  NO: { emoji: "🇳🇴", names: ["norway", "挪威"] },
  OM: { emoji: "🇴🇲", names: ["oman", "阿曼"] },
  PK: { emoji: "🇵🇰", names: ["pakistan", "巴基斯坦"] },
  PA: { emoji: "🇵🇦", names: ["panama", "巴拿马"] },
  PY: { emoji: "🇵🇾", names: ["paraguay", "巴拉圭"] },
  PE: { emoji: "🇵🇪", names: ["peru", "秘鲁"] },
  PH: { emoji: "🇵🇭", names: ["philippines", "菲律宾"] },
  PL: { emoji: "🇵🇱", names: ["poland", "波兰"] },
  PT: { emoji: "🇵🇹", names: ["portugal", "葡萄牙"] },
  QA: { emoji: "🇶🇦", names: ["qatar", "卡塔尔"] },
  RO: { emoji: "🇷🇴", names: ["romania", "罗马尼亚"] },
  RU: { emoji: "🇷🇺", names: ["russia", "俄罗斯", "俄国"] },
  SA: { emoji: "🇸🇦", names: ["saudi arabia", "沙特阿拉伯", "沙特"] },
  RS: { emoji: "🇷🇸", names: ["serbia", "塞尔维亚"] },
  SG: { emoji: "🇸🇬", names: ["singapore", "新加坡"] },
  SK: { emoji: "🇸🇰", names: ["slovakia", "斯洛伐克"] },
  SI: { emoji: "🇸🇮", names: ["slovenia", "斯洛文尼亚"] },
  ZA: { emoji: "🇿🇦", names: ["south africa", "南非"] },
  ES: { emoji: "🇪🇸", names: ["spain", "西班牙"] },
  LK: { emoji: "🇱🇰", names: ["sri lanka", "斯里兰卡", "+94"] },
  SE: { emoji: "🇸🇪", names: ["sweden", "瑞典"] },
  CH: { emoji: "🇨🇭", names: ["switzerland", "瑞士"] },
  SY: { emoji: "🇸🇾", names: ["syria", "叙利亚"] },
  TW: { emoji: "🇹🇼", names: ["taiwan", "台湾"] },
  TZ: { emoji: "🇹🇿", names: ["tanzania", "坦桑尼亚", "+255"] },
  TH: { emoji: "🇹🇭", names: ["thailand", "泰国"] },
  TR: { emoji: "🇹🇷", names: ["turkey", "土耳其"] },
  UA: { emoji: "🇺🇦", names: ["ukraine", "乌克兰"] },
  AE: { emoji: "🇦🇪", names: ["uae", "阿联酋", "迪拜"] },
  GB: { emoji: "🇬🇧", names: ["uk", "united kingdom", "英国"] },
  US: { emoji: "🇺🇸", names: ["usa", "united states", "美国", "us美国", "+1"] },
  UY: { emoji: "🇺🇾", names: ["uruguay", "乌拉圭"] },
  UZ: { emoji: "🇺🇿", names: ["uzbekistan", "乌兹别克斯坦"] },
  VE: { emoji: "🇻🇪", names: ["venezuela", "委内瑞拉"] },
  VN: { emoji: "🇻🇳", names: ["vietnam", "越南"] },
  YE: { emoji: "🇾🇪", names: ["yemen", "也门"] },
  ZW: { emoji: "🇿🇼", names: ["zimbabwe", "津巴布韦"] },
}

// 模糊匹配函数
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().replace(/\s+/g, "")
  const t = target.toLowerCase().replace(/\s+/g, "")
  
  // 完全包含
  if (t.includes(q) || q.includes(t)) return true
  
  // 拼音/变体匹配 - 检查连续字符
  let qIndex = 0
  for (let i = 0; i < t.length && qIndex < q.length; i++) {
    if (t[i] === q[qIndex]) {
      qIndex++
    }
  }
  if (qIndex === q.length) return true
  
  // 检查编辑距离（允许一定误差）
  const maxErrors = Math.floor(q.length / 3) + 1
  let errors = 0
  let tIndex = 0
  for (let i = 0; i < q.length && tIndex < t.length; i++) {
    if (q[i] === t[tIndex]) {
      tIndex++
    } else {
      errors++
      if (errors > maxErrors) return false
    }
  }
  
  return true
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "请输入搜索内容" }, { status: 400 })
    }

    const searchQuery = query.trim().toLowerCase()
    const results: { code: string; emoji: string; name: string; score: number }[] = []

    for (const [code, data] of Object.entries(countryEmojis)) {
      for (const name of data.names) {
        if (fuzzyMatch(searchQuery, name)) {
          // 计算匹配分数
          let score = 0
          const nameLower = name.toLowerCase()
          if (nameLower === searchQuery) score = 100
          else if (nameLower.startsWith(searchQuery)) score = 80
          else if (nameLower.includes(searchQuery)) score = 60
          else score = 40
          
          results.push({
            code,
            emoji: data.emoji,
            name: data.names[0], // 使用主名称
            score,
          })
          break // 每个国家只匹配一次
        }
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      results: results.slice(0, 10), // 最多返回10个结果
      query: searchQuery,
    })
  } catch (error) {
    console.error("搜索国旗emoji失败:", error)
    return NextResponse.json({ error: "搜索失败" }, { status: 500 })
  }
}
