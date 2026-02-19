'use client';

import { CheckCircle2, AlertTriangle, Clock, Globe } from 'lucide-react';
import { LogResult, Target } from '@/lib/db';
import { cn } from '@/lib/utils';

interface StatusCardProps {
    target: Target;
    latestLog?: LogResult;
}

export default function StatusCard({ target, latestLog }: StatusCardProps) {
    const isHealthy = latestLog?.status === 200 && latestLog?.result === 'OK';
    const isPending = !latestLog;

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border bg-deep-navy/40 backdrop-blur p-5 transition-all hover:scale-[1.02]",
            isHealthy ? "border-neon-green/20 shadow-[0_0_20px_-12px_#39FF14]" :
                isPending ? "border-white/10" : "border-red-500/50 shadow-[0_0_20px_-12px_#ef4444]"
        )}>
            {/* Background Glow */}
            <div className={cn(
                "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-10",
                isHealthy ? "bg-neon-green" : isPending ? "bg-gray-500" : "bg-red-500 animate-pulse"
            )} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2 text-white/80">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">{target.interval}m Interval</span>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                    isHealthy ? "bg-neon-green/10 text-neon-green border border-neon-green/20" :
                        isPending ? "bg-gray-800 text-gray-400 border border-white/10" :
                            "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                )}>
                    {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {isHealthy ? "정상" : isPending ? "대기중" : "장애"}
                </div>
            </div>

            <h3 className="text-lg font-bold text-white truncate mb-4" title={target.url}>
                {target.url.replace(/^https?:\/\//, '')}
            </h3>

            <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{latestLog?.latency || '-'}ms</span>
                </div>
                <span className="text-xs text-white/20">
                    {latestLog?.checked_at ? new Date(latestLog.checked_at).toLocaleTimeString() : 'No data'}
                </span>
            </div>
        </div>
    );
}
