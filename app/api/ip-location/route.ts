import { NextRequest, NextResponse } from "next/server"

// IP地址解析API - 使用免费的IP-API服务
export async function GET(request: NextRequest) {
  const ip = request.nextUrl.searchParams.get("ip")
  
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return NextResponse.json({ location: "本地网络" })
  }
  
  try {
    // 使用免费的 ip-api.com 服务
    const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city`, {
      next: { revalidate: 86400 } // 缓存24小时
    })
    
    if (!response.ok) {
      return NextResponse.json({ location: "未知" })
    }
    
    const data = await response.json()
    
    if (data.status === "success") {
      // 返回省+市格式
      const location = `${data.regionName || ""}${data.city || ""}`
      return NextResponse.json({ 
        location: location || data.country || "未知",
        province: data.regionName || "",
        city: data.city || "",
        country: data.country || ""
      })
    }
    
    return NextResponse.json({ location: "未知" })
  } catch (error) {
    console.error("IP解析失败:", error)
    return NextResponse.json({ location: "未知" })
  }
}
