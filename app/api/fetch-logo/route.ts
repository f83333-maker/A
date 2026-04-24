import { NextRequest, NextResponse } from "next/server"

// 补全URL
function normalizeUrl(input: string): string {
  let url = input.trim()
  // 移除可能的协议前缀空格
  url = url.replace(/^(https?:\/\/)\s+/, '$1')
  // 如果没有协议，添加 https://
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url
  }
  // 确保有 www 或者是有效域名
  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch {
    return url
  }
}

// 提取主色调
function getAverageColor(base64: string): Promise<string> {
  // 服务端无法使用 canvas，返回默认白色
  // 颜色提取将在前端完成
  return Promise.resolve('#ffffff')
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const normalizedUrl = normalizeUrl(url)
    let domain: string
    
    try {
      domain = new URL(normalizedUrl).hostname
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // 尝试多种方式获取 Logo
    const logoSources = [
      // Google Favicon 服务 (高质量)
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      // DuckDuckGo 图标服务
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      // 直接尝试网站的 favicon
      `${normalizedUrl}/favicon.ico`,
      `${normalizedUrl}/favicon.png`,
      `${normalizedUrl}/apple-touch-icon.png`,
    ]

    let logoBase64: string | null = null
    let logoUrl: string | null = null

    for (const source of logoSources) {
      try {
        const response = await fetch(source, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(5000)
        })
        
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('image') || source.includes('google.com/s2/favicons')) {
            const buffer = await response.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')
            const mimeType = contentType?.split(';')[0] || 'image/png'
            logoBase64 = `data:${mimeType};base64,${base64}`
            logoUrl = source
            break
          }
        }
      } catch {
        continue
      }
    }

    if (!logoBase64) {
      // 使用 Google Favicon 作为后备
      logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }

    return NextResponse.json({
      success: true,
      logoBase64,
      logoUrl,
      domain,
      normalizedUrl
    })

  } catch (error) {
    console.error("获取Logo失败:", error)
    return NextResponse.json({ error: "获取Logo失败" }, { status: 500 })
  }
}
