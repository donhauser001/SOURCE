/**
 * CLI 配置管理
 *
 * 存储 API Key 和服务器地址
 */

import Conf from 'conf';

interface ConfigSchema {
    apiKey?: string;
    serverUrl: string;
    profile: string;
}

const configStore = new Conf<ConfigSchema>({
    projectName: 'source-cli',
    defaults: {
        serverUrl: 'https://source.ink',
        profile: 'default',
    },
});

export const config = {
    /**
     * 获取 API Key
     */
    getApiKey(): string | undefined {
        // 优先从环境变量读取
        if (process.env.SOURCE_API_KEY) {
            return process.env.SOURCE_API_KEY;
        }
        return configStore.get('apiKey');
    },

    /**
     * 设置 API Key
     */
    setApiKey(key: string): void {
        configStore.set('apiKey', key);
    },

    /**
     * 清除 API Key
     */
    clearApiKey(): void {
        configStore.delete('apiKey');
    },

    /**
     * 获取服务器地址
     */
    getServerUrl(): string {
        if (process.env.SOURCE_SERVER_URL) {
            return process.env.SOURCE_SERVER_URL;
        }
        return configStore.get('serverUrl');
    },

    /**
     * 设置服务器地址
     */
    setServerUrl(url: string): void {
        configStore.set('serverUrl', url);
    },

    /**
     * 获取当前配置
     */
    getAll(): ConfigSchema {
        return {
            apiKey: this.getApiKey() ? '***' + this.getApiKey()!.slice(-4) : undefined,
            serverUrl: this.getServerUrl(),
            profile: configStore.get('profile'),
        };
    },

    /**
     * 重置配置
     */
    reset(): void {
        configStore.clear();
    },

    /**
     * 检查是否已配置 API Key
     */
    hasApiKey(): boolean {
        return !!this.getApiKey();
    },
};

