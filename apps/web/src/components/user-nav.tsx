'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

const tierLabels: Record<string, string> = {
    FREE: '免费用户',
    VERIFIED: '已验证',
    PAID: '付费用户',
    ADMIN: '管理员',
};

export function UserNav({ isDark = false }: { isDark?: boolean }) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className={cn(
                "h-8 w-8 rounded-full animate-pulse",
                isDark ? "bg-white/10" : "bg-foreground/5"
            )} />
        );
    }

    if (!session) {
        return (
            <Button asChild size="sm" className={cn(
                "h-8 px-4 rounded-full transition-all",
                isDark ? "bg-white/20 hover:bg-white/30 text-white border-0" : ""
            )}>
                <Link href="/login">登录</Link>
            </Button>
        );
    }

    const initials = session.user.name
        ? session.user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : session.user.email?.[0]?.toUpperCase() || 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full transition-opacity hover:opacity-80 outline-none">
                    <Avatar className={cn(
                        "h-8 w-8",
                        isDark ? "border border-white/20" : ""
                    )}>
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                        <AvatarFallback className={cn(
                            "text-xs",
                            isDark ? "bg-white/10 text-white/60" : "bg-foreground/5 text-foreground/60"
                        )}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-52 bg-background/95 backdrop-blur-xl border-foreground/10"
                align="end"
                forceMount
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {session.user.name || '用户'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                        </p>
                        {session.user.tier && (
                            <p className="text-xs leading-none text-muted-foreground mt-1">
                                {tierLabels[session.user.tier] || session.user.tier}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-foreground/5" />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="text-sm">
                        <Link href="/settings">
                            <User className="mr-2 h-4 w-4" />
                            <span>个人资料</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-sm">
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>设置</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-foreground/5" />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
