import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Oak Sans 基于 Figtree 字体设计，使用 Figtree 作为等效替代
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-oak-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CHUHAIZIYUAN - 专业账号批发服务',
  description: '专业的账号批发平台，提供优质账号批发服务',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${figtree.variable} bg-background`}>
      <body className="font-oak-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
