"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Copy, Check, RefreshCw } from "lucide-react"

// TOTP 算法实现
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const cleanedInput = base32.toUpperCase().replace(/[^A-Z2-7]/g, "")
  
  let bits = ""
  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char)
    if (index === -1) continue
    bits += index.toString(2).padStart(5, "0")
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2)
  }
  
  return bytes
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message)
  return new Uint8Array(signature)
}

async function generateTOTP(secret: string): Promise<string> {
  try {
    const key = base32ToBytes(secret)
    const time = Math.floor(Date.now() / 30000)
    
    const timeBuffer = new Uint8Array(8)
    let t = time
    for (let i = 7; i >= 0; i--) {
      timeBuffer[i] = t & 0xff
      t = Math.floor(t / 256)
    }
    
    const hmac = await hmacSha1(key, timeBuffer)
    const offset = hmac[hmac.length - 1] & 0xf
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000
    
    return code.toString().padStart(6, "0")
  } catch {
    return "------"
  }
}

export default function TwoFAPage() {
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [timeLeft, setTimeLeft] = useState(30)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = 30 - (Math.floor(Date.now() / 1000) % 30)
      setTimeLeft(seconds)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (secret.trim()) {
      generateTOTP(secret.trim()).then(setCode).catch(() => setCode("------"))
    } else {
      setCode("")
    }
  }, [secret, timeLeft])

  const handleCopy = () => {
    if (code && code !== "------") {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7CFF00]/10 mb-4">
              <Shield className="w-8 h-8 text-[#7CFF00]" />
            </div>
            <h1 className="text-2xl font-bold text-[#e3e3e3] mb-2">2FA 验证码生成器</h1>
            <p className="text-[#9aa0a6]">输入密钥生成动态验证码</p>
          </div>

          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#e3e3e3] mb-2">
                密钥 (Secret Key)
              </label>
              <input
                type="text"
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value)
                  setError("")
                }}
                placeholder="输入 Base32 格式的密钥"
                className="w-full h-12 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] placeholder-[#6e6e73] focus:outline-none focus:border-[#7CFF00] font-mono"
              />
              <p className="mt-2 text-xs text-[#6e6e73]">
                密钥通常在账号的安全设置中获取，格式如: JBSWY3DPEHPK3PXP
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#ee675c]/10 border border-[#ee675c]/30 rounded-lg">
                <p className="text-[#ee675c] text-sm">{error}</p>
              </div>
            )}

            {code && (
              <div className="text-center">
                <div className="relative inline-block">
                  <div 
                    className="text-5xl font-mono font-bold text-[#e3e3e3] tracking-[0.3em] mb-4 cursor-pointer hover:text-[#7CFF00] transition-colors"
                    onClick={handleCopy}
                  >
                    {code}
                  </div>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 text-[#9aa0a6] ${timeLeft <= 5 ? "animate-spin" : ""}`} />
                      <span className={`text-sm font-medium ${timeLeft <= 5 ? "text-[#ee675c]" : "text-[#9aa0a6]"}`}>
                        {timeLeft}s
                      </span>
                    </div>
                    
                    <div className="w-32 h-1.5 bg-[#2d2e30] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-[#ee675c]" : "bg-[#7CFF00]"}`}
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      />
                    </div>
                    
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-lg text-sm text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-[#fdd663]/10 border border-[#fdd663]/30 rounded-xl">
            <h3 className="text-sm font-semibold text-[#fdd663] mb-2">使用说明</h3>
            <ul className="text-sm text-[#9aa0a6] space-y-1">
              <li>1. 从账号安全设置中获取 2FA 密钥</li>
              <li>2. 将密钥粘贴到上方输入框</li>
              <li>3. 系统会自动生成 6 位动态验证码</li>
              <li>4. 验证码每 30 秒刷新一次</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
