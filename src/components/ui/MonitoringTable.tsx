'use client';

import { Target, LogResult } from '@/lib/db';
import { cn } from '@/lib/utils';
// @ts-ignore
import { Play, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { manualCheck } from '@/actions';
import { useRouter } from 'next/navigation';

export interface DashboardTarget extends Target {
    latestLog?: LogResult;
}

export function MonitoringTable({ targets }: { targets: DashboardTarget[] }) {
    const [checkingId, setCheckingId] = useState<number | null>(null);
    const [isCheckingAll, setIsCheckingAll] = useState(false);
    const [filter, setFilter] = useState<'REGION' | 'MAIN'>('REGION');
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
        // Check only FILTERED targets
        for (let i = 0; i < filteredTargets.length; i += batchSize) {
            const batch = filteredTargets.slice(i, i + batchSize);
            await Promise.all(batch.map(t => manualCheck(t.id)));
        }

        setIsCheckingAll(false);
        router.refresh();
    };

    if (!targets || targets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                <AlertTriangle className="w-10 h-10 mb-4 text-slate-600" />
                <p className="text-lg font-medium">등록된 모니터링 대상이 없습니다.</p>
                <p className="text-sm mt-2">관리자 페이지에서 엑셀 파일을 업로드해주세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Bar (Dynamic) */}
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-slate-400 font-bold">정상</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                        <span className="text-xl font-bold text-white">{okCount}</span>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-slate-400 font-bold">장애</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${failCount > 0 ? "bg-red-500 animate-bounce" : "bg-slate-700"}`} />
                        <span className={cn("text-xl font-bold", failCount > 0 ? "text-red-400" : "text-slate-600")}>{failCount}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                {/* Filter Tabs */}
                <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-lg">
                    <button
                        onClick={() => setFilter('REGION')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", filter === 'REGION' ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300")}
                    >
                        교육지원청
                    </button>
                    <button
                        onClick={() => setFilter('MAIN')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", filter === 'MAIN' ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300")}
                    >
                        본청/직속기관
                    </button>
                </div>

                <button
                    onClick={handleCheckAll}
                    disabled={isCheckingAll}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 disabled:opacity-50 self-end md:self-auto"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isCheckingAll && "animate-spin")} />
                    {isCheckingAll ? '점검 중...' : `현재 목록 점검 (${filteredTargets.length})`}
                </button>
            </div>

            {/* Grid: 2 cols on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredTargets.map((target) => {
                    const result = target.latestLog?.result || 'UNKNOWN';
                    const isOk = result === 'OK';
                    const isFail = result.startsWith('FAIL');
                    const isChecking = checkingId === target.id || isCheckingAll;

                    // Card Status Colors
                    const statusColor = isOk ? "text-[#39FF14]" : isFail ? "text-red-500" : "text-slate-500";
                    const borderColor = isOk ? "border-[#39FF14]/30" : isFail ? "border-red-500/50" : "border-slate-700";
                    const bgEffect = isOk ? "bg-[#39FF14]/5" : isFail ? "bg-red-500/5" : "bg-slate-900/40";

                    const hasWas = (target.was_cnt || 0) > 0;
                    const hasWeb = (target.web_cnt || 0) > 0;
                    const hasDb = !!target.db_info;



                    // Infra Badges (Static Info)
                    return (
                        <div key={target.id} className={cn("relative rounded-lg border p-2.5 flex flex-col gap-1.5 transition-all group hover:bg-slate-800/50", borderColor, bgEffect)}>

                            {/* Row 1: Status, Name --- [GAP] --- Play Button */}
                            <div className="flex flex-col gap-1 mb-1">

                                <div className="flex items-center gap-1.5 justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        <div className={cn("shrink-0 w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]", isOk ? "bg-[#39FF14] animate-pulse" : isFail ? "bg-red-500" : "bg-slate-500")} />
                                        <div className="flex flex-col overflow-hidden">
                                            <a href={target.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-white leading-tight hover:text-[#39FF14] transition-colors truncate">
                                                {target.name}
                                            </a>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{target.url}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Latency & Play Button */}
                                    <div className="flex items-center gap-2">
                                        {target.latestLog && (
                                            <span className={cn("text-[10px] font-mono font-bold truncate max-w-[100px] text-right", isOk ? "text-[#39FF14]" : isFail ? "text-red-400" : "text-slate-500")}>
                                                {isFail ? target.latestLog.result.replace('FAIL:', '') : `${target.latestLog.latency}ms`}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => handleCheck(e, target.id)}
                                            disabled={isChecking}
                                            className="shrink-0 p-1 rounded hover:bg-[#39FF14] hover:text-black text-slate-500 transition-colors disabled:opacity-50 active:scale-95 bg-slate-800/50"
                                        >
                                            {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                        </button>
                                    </div>
                                </div>
                            </div>


                        </div>
                    );
                })}
            </div>
        </div>
    );
}
