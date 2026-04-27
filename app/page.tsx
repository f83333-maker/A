import { Header } from "@/components/header"
import { HomeClient } from "@/components/home-client"
import { CategoryBrowser } from "@/components/category-browser"
import { Announcement } from "@/components/announcement"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"

async function getSiteSettings() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("site_settings").select("key, value")
    const settings: Record<string, any> = {}
    data?.forEach((item) => {
      try { settings[item.key] = JSON.parse(item.value) } catch { settings[item.key] = item.value }
    })
    return settings
  } catch {
    return {}
  }
}

export default async function Home() {
  const settings = await getSiteSettings()

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HomeClient
          initialTitle={settings.banner_title || ""}
          initialSubtitle={settings.banner_subtitle || ""}
          initialPlaceholder={settings.search_placeholder || "搜索产品名称、价格、库存、标签..."}
          initialHotTags={settings.hot_search_tags || ["社交媒体", "海外邮箱", "营销工具", "出海必备"]}
        />
        <div id="categories">
          <CategoryBrowser searchQuery="" />
        </div>
        <Announcement />
      </main>
      <Footer />
    </div>
  )
}
