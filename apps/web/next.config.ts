import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // 严格模式
    reactStrictMode: true,

    // 页面重定向（旧路由 → 新路由）
    async redirects() {
        return [
            // /works → /collab
            {
                source: '/works',
                destination: '/collab',
                permanent: true, // 301
            },
            // /works/:id → /collab/:id
            {
                source: '/works/:id',
                destination: '/collab/:id',
                permanent: true,
            },
            // /account/works → /account/contents
            {
                source: '/account/works',
                destination: '/account/contents',
                permanent: true,
            },
        ];
    },

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
        // 优化包导入 - 减少 bundle 大小
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
        ],
    },

    // 生产环境输出优化
    output: 'standalone',

    // 编译器优化
    compiler: {
        // 生产环境移除 console.log
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // 模块 ID 稳定化（更好的缓存）
    generateBuildId: async () => {
        // 使用 git commit hash 作为 build ID（如果可用）
        return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
    },
}

export default nextConfig
