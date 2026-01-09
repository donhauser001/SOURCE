'use client';

/**
 * Lab 光谱分析卡片 - 响应式版本
 * 
 * 根据屏幕宽度自动选择合适的布局：
 * - < 640px (sm): 手机版 - 垂直布局，可折叠工具栏
 * - 640px - 1024px (md-lg): 平板版 - 紧凑的左右布局
 * - > 1024px (xl): 桌面版 - 完整功能布局
 */

import { useEffect, useState } from 'react';
import { LabSpectrumCardDesktop } from './lab-spectrum-card.desktop';
import { LabSpectrumCardTablet } from './lab-spectrum-card.tablet';
import { LabSpectrumCardMobile } from './lab-spectrum-card.mobile';
import type { LabSpectrumCardProps } from './types';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setDeviceType('mobile');
            } else if (width < 1024) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
        };

        // 初始检查
        checkDevice();

        // 监听窗口大小变化
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return deviceType;
}

export function LabSpectrumCardResponsive(props: LabSpectrumCardProps) {
    const deviceType = useDeviceType();

    // 根据设备类型选择对应的组件
    switch (deviceType) {
        case 'mobile':
            return <LabSpectrumCardMobile {...props} />;
        case 'tablet':
            return <LabSpectrumCardTablet {...props} />;
        default:
            return <LabSpectrumCardDesktop {...props} />;
    }
}

/**
 * 也可以通过 props 强制指定版本
 */
export function LabSpectrumCardWithVariant({
    variant,
    ...props
}: LabSpectrumCardProps & { variant?: 'mobile' | 'tablet' | 'desktop' | 'auto' }) {
    const autoDeviceType = useDeviceType();
    const deviceType = variant === 'auto' || !variant ? autoDeviceType : variant;

    switch (deviceType) {
        case 'mobile':
            return <LabSpectrumCardMobile {...props} />;
        case 'tablet':
            return <LabSpectrumCardTablet {...props} />;
        default:
            return <LabSpectrumCardDesktop {...props} />;
    }
}
