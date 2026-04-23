"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CopyButtonProps {
  content: string
}

export function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-lg text-[13px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#81c995]" />
          <span className="text-[#81c995]">已复制</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          复制
        </>
      )}
    </button>
  )
}
