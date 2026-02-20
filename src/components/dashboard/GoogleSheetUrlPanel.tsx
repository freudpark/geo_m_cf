'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Download, AlertCircle, CheckCircle, History } from 'lucide-react';
import { syncGoogleSheet, getLastSyncedUrl } from '@/actions';
import { useRouter } from 'next/navigation';

export default function GoogleSheetUrlPanel() {
    // Hardcoded default URL as per user request
    const DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/1ba41P8uZN0IM5cqSZTUD0bUPdEu4fPasOxG1Dog2xEg/edit?usp=sharing';
    const [url, setUrl] = useState(DEFAULT_URL);
    const [isSyncing, setIsSyncing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();

    // Load last synced URL from D1 on mount (optional, priority given to hardcoded default if D1 is empty)
    useEffect(() => {
        const loadLastUrl = async () => {
            try {
                const lastUrl = await getLastSyncedUrl();
                if (lastUrl) setUrl(lastUrl);
            } catch (e) {
                console.error("Failed to load last URL:", e);
            }
        };
        loadLastUrl();
    }, []);

    const handleSync = async () => {
        console.log("Sync button clicked with URL:", url);
        if (!url) {
            setMessage({ type: 'error', text: '구글 시트 주소를 입력해주세요.' });
            return;
        }

        if (!url.includes('docs.google.com/spreadsheets')) {
            setMessage({ type: 'error', text: '올바른 구글 시트 주소가 아닙니다.' });
            return;
        }

        setIsSyncing(true);
        setMessage(null);

        try {
            const result = await syncGoogleSheet(url);
            if (result.success) {
                setMessage({ type: 'success', text: `${result.count}개의 기관 정보가 동기화되었습니다.` });
                router.refresh(); // Update dashboard
            } else {
                setMessage({ type: 'error', text: result.error || '동기화 실패' });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || '오류 발생' });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="bg-[#1E293B]/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/10 blur-[100px] rounded-full group-hover:bg-[#39FF14]/20 transition-all duration-700"></div>

            <div className="relative flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <LinkIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="공유된 구글 시트 URL을 입력하세요"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/30 transition-all placeholder:text-slate-600 shadow-inner"
                    />
                </div>

                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full md:w-auto bg-[#39FF14] text-[#0F172A] px-8 py-4 rounded-2xl font-black text-sm hover:bg-[#32d912] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] min-w-[140px]"
                >
                    {isSyncing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>연동 중...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            <span>가져오기</span>
                        </>
                    )}
                </button>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 duration-300
                    ${message.type === 'success' ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-red-500/10 text-red-400'}
                `}>
                    {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {message.text}
                </div>
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <History className="w-3 h-3" />
                    Last Sync Info:
                </div>
                <div className="text-[10px] text-slate-400 truncate flex-1">
                    {url ? "Linked to active sheet" : "No active link found. Please link a Google Sheet."}
                </div>
            </div>
        </div>
    );
}
