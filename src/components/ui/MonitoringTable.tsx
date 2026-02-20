'use client';

import { Target, LogResult } from '@/lib/db';
import { cn } from '@/lib/utils';
// @ts-ignore
import { Play, Loader2, RefreshCw, ExternalLink, Globe, Server, Database } from 'lucide-react';
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
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-medium text-slate-300">Normal: <span className="text-white font-bold">{okCount}</span></span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-xs font-medium text-slate-300">Error: <span className="text-white font-bold">{failCount}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1.5 outline-none focus:border-slate-600"
                    >
                        <option value="ALL">전체 보기 ({targets.length})</option>
                        <option value="REGION">교육지원청</option>
                        <option value="MAIN">본청/직속기관</option>
                    </select>

                    <button
                        onClick={handleCheckAll}
                        disabled={isCheckingAll}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isCheckingAll && "animate-spin")} />
                        {isCheckingAll ? 'Checking...' : 'Check All'}
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                            <th className="px-4 py-3 w-[40px] text-center">#</th>
                            <th className="px-4 py-3">Organzation</th>
                            <th className="px-4 py-3 hidden md:table-cell">URL</th>
                            <th className="px-4 py-3 text-center">Resources</th>
                            <th className="px-4 py-3 text-right">Status</th>
                            <th className="px-4 py-3 w-[60px] text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredTargets.map((target, idx) => {
                            const result = target.latestLog?.result || 'UNKNOWN';
                            const isOk = result === 'OK';
                            const isFail = result.startsWith('FAIL');
                            const isChecking = checkingId === target.id || isCheckingAll;
                            const statusColor = isOk ? "text-emerald-400" : isFail ? "text-red-400" : "text-slate-500";
                            const latency = target.latestLog?.latency;

                            return (
                                <tr key={target.id} className="group hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3 text-center text-xs text-slate-600 font-mono">
                                        {idx + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", isOk ? "bg-emerald-500" : isFail ? "bg-red-500" : "bg-slate-600")} />
                                            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                                {target.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <a href={target.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-indigo-400 hover:underline flex items-center gap-1 transition-colors truncate max-w-[200px]">
                                            {target.url}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-mono">
                                            {(target.was_cnt || 0) > 0 && (
                                                <span className="flex items-center gap-1" title={`WAS: ${target.was_cnt}`}>
                                                    <Server className="w-3 h-3" /> {target.was_cnt}
                                                </span>
                                            )}
                                            {(target.web_cnt || 0) > 0 && (
                                                <span className="flex items-center gap-1" title={`WEB: ${target.web_cnt}`}>
                                                    <Globe className="w-3 h-3" /> {target.web_cnt}
                                                </span>
                                            )}
                                            {target.db_info && (
                                                <span className="flex items-center gap-1" title={`DB: ${target.db_info}`}>
                                                    <Database className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={cn("text-xs font-bold font-mono", statusColor)}>
                                                {isFail ? "ERROR" : isOk ? "NORMAL" : "PENDING"}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-mono">
                                                {latency ? `${latency}ms` : '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={(e) => handleCheck(e, target.id)}
                                            disabled={isChecking}
                                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                            title="Re-check now"
                                        >
                                            {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
