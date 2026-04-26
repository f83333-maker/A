import { NextResponse } from "next/server"

// 国家代码到名称的映射（包含中文、英文和区号）
const countries: Record<string, { names: string[]; zhName: string }> = {
  AF: { names: ["afghanistan", "阿富汗"], zhName: "阿富汗" },
  AL: { names: ["albania", "阿尔巴尼亚"], zhName: "阿尔巴尼亚" },
  DZ: { names: ["algeria", "阿尔及利亚"], zhName: "阿尔及利亚" },
  AD: { names: ["andorra", "安道尔"], zhName: "安道尔" },
  AO: { names: ["angola", "安哥拉"], zhName: "安哥拉" },
  AR: { names: ["argentina", "阿根廷"], zhName: "阿根廷" },
  AM: { names: ["armenia", "亚美尼亚"], zhName: "亚美尼亚" },
  AU: { names: ["australia", "澳大利亚", "澳洲"], zhName: "澳大利亚" },
  AT: { names: ["austria", "奥地利"], zhName: "奥地利" },
  AZ: { names: ["azerbaijan", "阿塞拜疆"], zhName: "阿塞拜疆" },
  BH: { names: ["bahrain", "巴林"], zhName: "巴林" },
  BD: { names: ["bangladesh", "孟加拉", "孟加拉国", "+880", "880"], zhName: "孟加拉" },
  BY: { names: ["belarus", "白俄罗斯"], zhName: "白俄罗斯" },
  BE: { names: ["belgium", "比利时"], zhName: "比利时" },
  BJ: { names: ["benin", "贝宁", "+229", "229"], zhName: "贝宁" },
  BT: { names: ["bhutan", "不丹"], zhName: "不丹" },
  BO: { names: ["bolivia", "玻利维亚"], zhName: "玻利维亚" },
  BA: { names: ["bosnia", "波斯尼亚", "波黑"], zhName: "波黑" },
  BW: { names: ["botswana", "博茨瓦纳"], zhName: "博茨瓦纳" },
  BR: { names: ["brazil", "巴西", "+55", "55"], zhName: "巴西" },
  BN: { names: ["brunei", "文莱"], zhName: "文莱" },
  BG: { names: ["bulgaria", "保加利亚"], zhName: "保加利亚" },
  KH: { names: ["cambodia", "柬埔寨"], zhName: "柬埔寨" },
  CM: { names: ["cameroon", "喀麦隆"], zhName: "喀麦隆" },
  CA: { names: ["canada", "加拿大"], zhName: "加拿大" },
  TD: { names: ["chad", "乍得"], zhName: "乍得" },
  CL: { names: ["chile", "智利"], zhName: "智利" },
  CN: { names: ["china", "中国", "中华人民共和国", "+86", "86"], zhName: "中国" },
  CO: { names: ["colombia", "哥伦比亚", "+57", "57"], zhName: "哥伦比亚" },
  KM: { names: ["comoros", "科摩罗"], zhName: "科摩罗" },
  CR: { names: ["costa rica", "哥斯达黎加"], zhName: "哥斯达黎加" },
  CI: { names: ["cote divoire", "科特迪瓦", "象牙海岸"], zhName: "科特迪瓦" },
  HR: { names: ["croatia", "克罗地亚"], zhName: "克罗地亚" },
  CU: { names: ["cuba", "古巴"], zhName: "古巴" },
  CY: { names: ["cyprus", "塞浦路斯"], zhName: "塞浦路斯" },
  CZ: { names: ["czech", "捷克"], zhName: "捷克" },
  CD: { names: ["congo", "刚果民主共和国", "刚果金"], zhName: "刚果(金)" },
  DJ: { names: ["djibouti", "吉布提"], zhName: "吉布提" },
  DK: { names: ["denmark", "丹麦"], zhName: "丹麦" },
  EC: { names: ["ecuador", "厄瓜多尔"], zhName: "厄瓜多尔" },
  EG: { names: ["egypt", "埃及", "+20", "20"], zhName: "埃及" },
  SV: { names: ["el salvador", "萨尔瓦多"], zhName: "萨尔瓦多" },
  GQ: { names: ["equatorial guinea", "赤道几内亚"], zhName: "赤道几内亚" },
  ER: { names: ["eritrea", "厄立特里亚"], zhName: "厄立特里亚" },
  EE: { names: ["estonia", "爱沙尼亚"], zhName: "爱沙尼亚" },
  ET: { names: ["ethiopia", "埃塞俄比亚"], zhName: "埃塞俄比亚" },
  FI: { names: ["finland", "芬兰"], zhName: "芬兰" },
  FR: { names: ["france", "法国", "+33", "33"], zhName: "法国" },
  GA: { names: ["gabon", "加蓬"], zhName: "加蓬" },
  GM: { names: ["gambia", "冈比亚"], zhName: "冈比亚" },
  DE: { names: ["germany", "德国", "+49", "49"], zhName: "德国" },
  GH: { names: ["ghana", "加纳"], zhName: "加纳" },
  GR: { names: ["greece", "希腊"], zhName: "希腊" },
  GT: { names: ["guatemala", "危地马拉"], zhName: "危地马拉" },
  GN: { names: ["guinea", "几内亚"], zhName: "几内亚" },
  GW: { names: ["guinea-bissau", "几内亚比绍"], zhName: "几内亚比绍" },
  HK: { names: ["hong kong", "香港", "+852", "852"], zhName: "香港" },
  HU: { names: ["hungary", "匈牙利"], zhName: "匈牙利" },
  IS: { names: ["iceland", "冰岛"], zhName: "冰岛" },
  IN: { names: ["india", "印度", "+91", "91"], zhName: "印度" },
  ID: { names: ["indonesia", "印尼", "印度尼西亚", "+62", "62"], zhName: "印尼" },
  IR: { names: ["iran", "伊朗"], zhName: "伊朗" },
  IQ: { names: ["iraq", "伊拉克"], zhName: "伊拉克" },
  IE: { names: ["ireland", "爱尔兰"], zhName: "爱尔兰" },
  IL: { names: ["israel", "以色列"], zhName: "以色列" },
  IT: { names: ["italy", "意大利"], zhName: "意大利" },
  JP: { names: ["japan", "日本", "+81", "81"], zhName: "日本" },
  JO: { names: ["jordan", "约旦"], zhName: "约旦" },
  KZ: { names: ["kazakhstan", "哈萨克斯坦"], zhName: "哈萨克斯坦" },
  KE: { names: ["kenya", "肯尼亚"], zhName: "肯尼亚" },
  KP: { names: ["north korea", "朝鲜"], zhName: "朝鲜" },
  KR: { names: ["south korea", "韩国", "+82", "82"], zhName: "韩国" },
  KW: { names: ["kuwait", "科威特"], zhName: "科威特" },
  KG: { names: ["kyrgyzstan", "吉尔吉斯斯坦"], zhName: "吉尔吉斯斯坦" },
  LA: { names: ["laos", "老挝"], zhName: "老挝" },
  LV: { names: ["latvia", "拉脱维亚"], zhName: "拉脱维亚" },
  LB: { names: ["lebanon", "黎巴嫩"], zhName: "黎巴嫩" },
  LS: { names: ["lesotho", "莱索托"], zhName: "莱索托" },
  LR: { names: ["liberia", "利比里亚"], zhName: "利比里亚" },
  LY: { names: ["libya", "利比亚"], zhName: "利比亚" },
  LI: { names: ["liechtenstein", "列支敦士登"], zhName: "列支敦士登" },
  LT: { names: ["lithuania", "立陶宛"], zhName: "立陶宛" },
  LU: { names: ["luxembourg", "卢森堡"], zhName: "卢森堡" },
  MO: { names: ["macau", "澳门", "+853", "853"], zhName: "澳门" },
  MG: { names: ["madagascar", "马达加斯加"], zhName: "马达加斯加" },
  MW: { names: ["malawi", "马拉维"], zhName: "马拉维" },
  MY: { names: ["malaysia", "马来西亚", "大马", "+60", "60"], zhName: "马来西亚" },
  MV: { names: ["maldives", "马尔代夫"], zhName: "马尔代夫" },
  ML: { names: ["mali", "马里"], zhName: "马里" },
  MT: { names: ["malta", "马耳他"], zhName: "马耳他" },
  MR: { names: ["mauritania", "毛里塔尼亚"], zhName: "毛里塔尼亚" },
  MU: { names: ["mauritius", "毛里求斯"], zhName: "毛里求斯" },
  MX: { names: ["mexico", "墨西哥", "+52", "52"], zhName: "墨西哥" },
  MN: { names: ["mongolia", "蒙古"], zhName: "蒙古" },
  ME: { names: ["montenegro", "黑山"], zhName: "黑山" },
  MA: { names: ["morocco", "摩洛哥"], zhName: "摩洛哥" },
  MZ: { names: ["mozambique", "莫桑比克"], zhName: "莫桑比克" },
  MM: { names: ["myanmar", "缅甸", "+95", "95"], zhName: "缅甸" },
  NA: { names: ["namibia", "纳米比亚"], zhName: "纳米比亚" },
  NP: { names: ["nepal", "尼泊尔"], zhName: "尼泊尔" },
  NL: { names: ["netherlands", "荷兰", "+31", "31"], zhName: "荷兰" },
  NZ: { names: ["new zealand", "新西兰"], zhName: "新西兰" },
  NE: { names: ["niger", "尼日尔"], zhName: "尼日尔" },
  NG: { names: ["nigeria", "尼日利亚", "+234", "234"], zhName: "尼日利亚" },
  MK: { names: ["north macedonia", "北马其顿"], zhName: "北马其顿" },
  NO: { names: ["norway", "挪威"], zhName: "挪威" },
  OM: { names: ["oman", "阿曼"], zhName: "阿曼" },
  PK: { names: ["pakistan", "巴基斯坦", "+92", "92"], zhName: "巴基斯坦" },
  PA: { names: ["panama", "巴拿马"], zhName: "巴拿马" },
  PY: { names: ["paraguay", "巴拉圭"], zhName: "巴拉圭" },
  PE: { names: ["peru", "秘鲁"], zhName: "秘鲁" },
  PH: { names: ["philippines", "菲律宾", "+63", "63"], zhName: "菲律宾" },
  PL: { names: ["poland", "波兰"], zhName: "波兰" },
  PT: { names: ["portugal", "葡萄牙"], zhName: "葡萄牙" },
  QA: { names: ["qatar", "卡塔尔"], zhName: "卡塔尔" },
  CG: { names: ["republic of congo", "刚果共和国", "刚果布"], zhName: "刚果(布)" },
  RO: { names: ["romania", "罗马尼亚"], zhName: "罗马尼亚" },
  RU: { names: ["russia", "俄罗斯", "俄国", "+7", "7"], zhName: "俄罗斯" },
  RW: { names: ["rwanda", "卢旺达"], zhName: "卢旺达" },
  SA: { names: ["saudi arabia", "沙特阿拉伯", "沙特"], zhName: "沙特" },
  SN: { names: ["senegal", "塞内加尔"], zhName: "塞内加尔" },
  RS: { names: ["serbia", "塞尔维亚"], zhName: "塞尔维亚" },
  SG: { names: ["singapore", "新加坡", "+65", "65"], zhName: "新加坡" },
  SK: { names: ["slovakia", "斯洛伐克"], zhName: "斯洛伐克" },
  SI: { names: ["slovenia", "斯洛文尼亚"], zhName: "斯洛文尼亚" },
  SO: { names: ["somalia", "索马里"], zhName: "索马里" },
  ZA: { names: ["south africa", "南非"], zhName: "南非" },
  ES: { names: ["spain", "西班牙", "+34", "34"], zhName: "西班牙" },
  LK: { names: ["sri lanka", "斯里兰卡", "+94", "94"], zhName: "斯里兰卡" },
  SD: { names: ["sudan", "苏丹"], zhName: "苏丹" },
  SR: { names: ["suriname", "苏里南"], zhName: "苏里南" },
  SE: { names: ["sweden", "瑞典"], zhName: "瑞典" },
  CH: { names: ["switzerland", "瑞士"], zhName: "瑞士" },
  SY: { names: ["syria", "叙利亚"], zhName: "叙利亚" },
  TW: { names: ["taiwan", "台湾", "+886", "886"], zhName: "台湾" },
  TJ: { names: ["tajikistan", "塔吉克斯坦"], zhName: "塔吉克斯坦" },
  TZ: { names: ["tanzania", "坦桑尼亚", "+255", "255"], zhName: "坦桑尼亚" },
  TH: { names: ["thailand", "泰国", "+66", "66"], zhName: "泰国" },
  TL: { names: ["timor-leste", "东帝汶"], zhName: "东帝汶" },
  TG: { names: ["togo", "多哥"], zhName: "多哥" },
  TN: { names: ["tunisia", "突尼斯"], zhName: "突尼斯" },
  TR: { names: ["turkey", "土耳其", "+90", "90"], zhName: "土耳其" },
  TM: { names: ["turkmenistan", "土库曼斯坦"], zhName: "土库曼斯坦" },
  UG: { names: ["uganda", "乌干达"], zhName: "乌干达" },
  UA: { names: ["ukraine", "乌克兰", "+380", "380"], zhName: "乌克兰" },
  AE: { names: ["uae", "阿联酋", "迪拜", "+971", "971"], zhName: "阿联酋" },
  GB: { names: ["uk", "united kingdom", "英国", "+44", "44"], zhName: "英国" },
  US: { names: ["usa", "united states", "美国", "us美国", "+1", "1"], zhName: "美国" },
  UY: { names: ["uruguay", "乌拉圭"], zhName: "乌拉圭" },
  UZ: { names: ["uzbekistan", "乌兹别克斯坦"], zhName: "乌兹别克斯坦" },
  VA: { names: ["vatican", "梵蒂冈"], zhName: "梵蒂冈" },
  VE: { names: ["venezuela", "委内瑞拉"], zhName: "委内瑞拉" },
  VN: { names: ["vietnam", "越南", "+84", "84"], zhName: "越南" },
  EH: { names: ["western sahara", "西撒哈拉"], zhName: "西撒哈拉" },
  YE: { names: ["yemen", "也门"], zhName: "也门" },
  ZM: { names: ["zambia", "赞比亚"], zhName: "赞比亚" },
  ZW: { names: ["zimbabwe", "津巴布韦"], zhName: "津巴布韦" },
}

// 获取国旗图片URL（使用flagcdn.com）
function getFlagImageUrl(countryCode: string): string {
  // 使用 w40 格式，这是 flagcdn.com 支持的格式
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
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
    const results: { code: string; flagUrl: string; name: string; score: number }[] = []

    for (const [code, data] of Object.entries(countries)) {
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
            flagUrl: getFlagImageUrl(code),
            name: data.zhName,
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
    console.error("搜索国旗失败:", error)
    return NextResponse.json({ error: "搜索失败" }, { status: 500 })
  }
}
