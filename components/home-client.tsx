"use client"

import { useState, useEffect } from "react"
import { SearchBanner } from "@/components/search-banner"

interface HomeClientProps {
  initialTitle: string
  initialSubtitle: string
  initialPlaceholder: string
  initialHotTags: string[]
}

export function HomeClient({
  initialTitle,
  initialSubtitle,
  initialPlaceholder,
  initialHotTags,
}: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState("")

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
    <SearchBanner
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      initialTitle={initialTitle}
      initialSubtitle={initialSubtitle}
      initialPlaceholder={initialPlaceholder}
      initialHotTags={initialHotTags}
    />
  )
}

