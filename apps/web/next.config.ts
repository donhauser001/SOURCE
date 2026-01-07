import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // 严格模式
    reactStrictMode: true,

    // 图片域名白名单
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.source.com',
            },
        ],
    },

    // 实验性功能
    experimental: {
        // 类型化路由
        typedRoutes: true,
    },
}

export default nextConfig

