'use client';

import { Target, LogResult } from '@/lib/db';
import { cn } from '@/lib/utils';
// @ts-ignore
import { Play, Loader2, RefreshCw, ExternalLink, Globe, Server, Database, Settings } from 'lucide-react';
import { useState } from 'react';
import { manualCheck } from '@/actions';
import { useRouter } from 'next/navigation';

export interface DashboardTarget extends Target {
    latestLog?: LogResult;
}

export function MonitoringTable({ targets }: { targets: DashboardTarget[] }) {
    const [checkingId, setCheckingId] = useState<number | null>(null);
    const [isCheckingAll, setIsCheckingAll] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'REGION' | 'MAIN'>('ALL');
    const router = useRouter();

    const filteredTargets = targets.filter(t => {
        if (filter === 'REGION') return t.category === '교육지원청' || t.category === '지역교육청';
        if (filter === 'MAIN') return t.category === '본청/직속기관';
        return true;
    });

    const activeCount = filteredTargets.length;
    const okCount = filteredTargets.filter(t => t.latestLog?.result === 'OK' || (t.latestLog?.status && t.latestLog.status >= 200 && t.latestLog.status < 400)).length;
    const failCount = activeCount - okCount;

    const handleCheck = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (checkingId || isCheckingAll) return;

        setCheckingId(id);
        await manualCheck(id);
        setCheckingId(null);
        router.refresh();
    };

    const handleCheckAll = async () => {
        if (isCheckingAll) return;
        setIsCheckingAll(true);

        const batchSize = 5;
        for (let i = 0; i < filteredTargets.length; i += batchSize) {
            const batch = filteredTargets.slice(i, i + batchSize);
            await Promise.all(batch.map(t => manualCheck(t.id)));
        }

        setIsCheckingAll(false);
        router.refresh();
    };

    if (!targets || targets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-900/20">
                <Globe className="w-10 h-10 mb-4 text-slate-600" />
                <p className="text-lg font-medium">No Targets Found</p>
                <p className="text-sm mt-2">Please import data via Google Sheet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Control Bar: Status & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-lg shadow-black/20">
                    <span className="text-sm font-medium text-slate-400">정상</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-2xl font-bold text-white">{okCount}</span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-lg shadow-black/20">
                    <span className="text-sm font-medium text-slate-400">장애</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-2xl font-bold text-red-500">{failCount}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
                    <button
                        onClick={() => setFilter('REGION')}
                        className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'REGION' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
                    >
                        교육지원청
                    </button>
                    <button
                        onClick={() => setFilter('MAIN')}
                        className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'MAIN' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
                    >
                        본청/직속기관
                    </button>
                </div>

                <button
                    onClick={handleCheckAll}
                    disabled={isCheckingAll}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isCheckingAll && "animate-spin")} />
                    {isCheckingAll ? '점검 중...' : '전체 점검'}
                </button>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTargets.map((target) => {
                    const result = target.latestLog?.result || 'UNKNOWN';
                    const isOk = result === 'OK';
                    const isFail = result.startsWith('FAIL');
                    const isChecking = checkingId === target.id || isCheckingAll;
                    const latency = target.latestLog?.latency;

                    return (
                        <div
                            key={target.id}
                            className={cn(
                                "group relative bg-slate-900 border rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5",
                                isFail ? "border-red-900/50 bg-red-950/10" : "border-slate-800 hover:border-slate-700"
                            )}
                        >
                            {/* Status Bar */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors",
                                isOk ? "bg-emerald-500" : isFail ? "bg-red-500" : "bg-slate-700"
                            )} />

                            <div className="flex items-center justify-between mb-3 pl-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isOk ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : isFail ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-slate-600"
                                    )} />
                                    <h3 className={cn("font-bold text-sm tracking-tight", isFail ? "text-red-400" : "text-slate-100")}>
                                        {target.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-mono font-bold",
                                        isOk ? "text-emerald-500" : isFail ? "text-red-500" : "text-slate-600"
                                    )}>
                                        {latency ? `${latency}ms` : '-'}
                                    </span>
                                    <button
                                        onClick={(e) => handleCheck(e, target.id)}
                                        disabled={isChecking}
                                        className="text-slate-600 hover:text-emerald-400 transition-colors disabled:opacity-50"
                                    >
                                        {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pl-2 space-y-1">
                                <a
                                    href={target.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors truncate block flex items-center gap-1 group-hover:text-slate-400"
                                >
                                    {target.url}
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
