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
        // Debug: Force alert to confirm click
        // alert(`Sync started with URL: ${url}`); 
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
            console.log("Sync result:", result);

            if (result.success) {
                setMessage({ type: 'success', text: `${result.count}개의 기관 정보가 동기화되었습니다.` });
                router.refresh();
                // alert(`성공! ${result.count}개 데이터 로드 완료`);
            } else {
                setMessage({ type: 'error', text: result.error || '동기화 실패' });
                alert(`오류 발생: ${result.error}`);
            }
        } catch (e: any) {
            console.error("Sync Exception:", e);
            setMessage({ type: 'error', text: e.message || '오류 발생' });
            alert(`시스템 오류: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <LinkIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="공유된 구글 시트 URL을 입력하세요"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all placeholder:text-slate-600"
                    />
                </div>

                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-md font-medium text-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 min-w-[100px]"
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
                <div className={`mt-3 p-2.5 rounded-md flex items-center gap-2 text-xs font-medium animate-in slide-in-from-top-1 duration-200
                    ${message.type === 'success' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/30 text-red-400 border border-red-900/50'}
                `}>
                    {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {message.text}
                </div>
            )}

            <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    <History className="w-3 h-3" />
                    Last Sync Info:
                </div>
                <div className="text-[10px] text-slate-400 truncate flex-1 font-mono">
                    {url ? "Linked" : "Not Linked"}
                </div>
            </div>
        </div>
    );
}
