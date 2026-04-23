"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SearchBanner } from "@/components/search-banner"
import { CategoryBrowser } from "@/components/category-browser"
import { Features } from "@/components/features"
import { Announcement } from "@/components/announcement"
import { Footer } from "@/components/footer"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <SearchBanner searchQuery={searchQuery} onSearch={setSearchQuery} />
        <Features />
        <CategoryBrowser searchQuery={searchQuery} />
        <Announcement />
      </main>
      <Footer />
    </div>
  )
}
