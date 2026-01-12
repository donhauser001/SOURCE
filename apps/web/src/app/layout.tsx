import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SiteFooter } from '@/components/site-footer'

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
    title: {
        default: 'SOURCE - 实体印刷色彩实操体系',
        template: '%s | SOURCE',
    },
    description: '不被定义的色彩：一个基于现实验证的色彩体系',
    keywords: ['印刷', '色彩', '专色', 'Lab', '打样'],
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <body className={`${montserrat.variable} font-sans antialiased min-h-screen flex flex-col`}>
                <Providers>
                    <div className="flex-1">{children}</div>
                    <SiteFooter />
                </Providers>
            </body>
        </html>
    )
}
