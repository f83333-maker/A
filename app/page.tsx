"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SearchBanner } from "@/components/search-banner"
import { CategoryBrowser } from "@/components/category-browser"
import { Features } from "@/components/features"
import { Announcement } from "@/components/announcement"
import { Footer } from "@/components/footer"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")

  // 从其他页面跳回首页时，自动处理 hash 定位
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: "smooth" })
      }, 300)
    }
  }, [])

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <SearchBanner searchQuery={searchQuery} onSearch={setSearchQuery} />
        <Features />
        <div id="categories">
          <CategoryBrowser searchQuery={searchQuery} />
        </div>
        <Announcement />
      </main>
      <Footer />
    </div>
  )
}
