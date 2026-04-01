import type { Metadata, Viewport } from 'next'
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const notoSans = Noto_Sans_SC({ 
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
})

const notoSerif = Noto_Serif_SC({ 
  subsets: ["latin"],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: '吃啥 - 今天吃点啥',
  description: '温暖复古风的餐饮计划与美食发现应用',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E8E4DC',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#F5F1E8',
              color: '#3E3A39',
              border: '1px solid #C9C5BD',
              borderRadius: '16px',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
