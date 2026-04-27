"use client"

import { useState, useEffect, cloneElement, isValidElement } from "react"

export function HomeClient({ children }: { children: React.ReactNode }) {
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

  // 把 searchQuery 和 onSearch 注入到 SearchBanner 子组件
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        searchQuery,
        onSearch: setSearchQuery,
      })
    : children

  return <>{childrenWithProps}</>
}
