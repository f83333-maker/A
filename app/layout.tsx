import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC, Roboto_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"]
});
const notoSansSC = Noto_Sans_SC({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  weight: ["300", "400", "500", "700"]
});
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable} ${robotoMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
