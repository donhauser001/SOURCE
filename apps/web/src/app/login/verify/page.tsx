import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <div className="w-full max-w-md p-8">
                <div className="bg-background rounded-lg border p-8 shadow-sm text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">检查你的邮箱</h1>
                    <p className="text-muted-foreground mb-6">我们已发送了一封包含登录链接的邮件</p>
                    <p className="text-sm text-muted-foreground mb-4">点击邮件中的链接即可完成登录</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        返回登录
                    </Link>
                </div>
            </div>
        </div>
    );
}

