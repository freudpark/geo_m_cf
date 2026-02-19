'use client';
import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { syncGoogleSheet } from '@/actions';

export default function GoogleSheetSync() {
    const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/1ba41P8uZN0IM5cqSZTUD0bUPdEu4fPasOxG1Dog2xEg/edit?usp=sharing');
    const [isSyncing, setIsSyncing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem('googleSheetHistory');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }
    }, []);

    const saveToHistory = (newUrl: string) => {
        const updated = [newUrl, ...history.filter(h => h !== newUrl)].slice(0, 5); // Keep max 5 unique
        setHistory(updated);
        localStorage.setItem('googleSheetHistory', JSON.stringify(updated));
    };

    const handleSync = async () => {
        if (!url) {
            setMessage({ type: 'error', text: '구글 시트 주소를 입력해주세요.' });
            return;
        }

        // Basic validation for Google Sheets URL
        if (!url.includes('docs.google.com/spreadsheets')) {
            setMessage({ type: 'error', text: '올바른 구글 시트 주소가 아닙니다. (docs.google.com)' });
            return;
        }

        setIsSyncing(true);
        setMessage(null);

        try {
            const result = await syncGoogleSheet(url);
            if (result.success) {
                setMessage({ type: 'success', text: `${result.count}개의 사이트가 동기화되었습니다.` });
                saveToHistory(url);
                setUrl(''); // Clear input on success
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
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600/20 rounded-lg">
                    <LinkIcon className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">구글 시트 동기화</h3>
            </div>

            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                구글 시트의 <strong>[공유]</strong> 설정이 '링크가 있는 모든 사용자에게 공개'로 되어 있어야 합니다.
                <br />
                브라우저 주소창의 URL을 그대로 복사해서 입력하세요.
                <br />
                <span className="text-xs text-slate-500 block mt-1">
                    * 필수 컬럼: <strong>구분, 홈페이지명, URL, IP</strong>
                </span>
            </p>

            <div className="flex flex-col gap-2 mb-4">
                <div className="relative flex gap-2">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onFocus={() => setShowHistory(true)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#39FF14] transition-colors placeholder:text-slate-600"
                        />
                        {/* History Dropdown (Custom implementation for better UI than datalist) */}
                        {showHistory && history.length > 0 && (
                            <div
                                className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden"
                                onMouseLeave={() => setShowHistory(false)}
                            >
                                <div className="text-xs text-slate-500 px-3 py-2 bg-slate-950 border-b border-slate-800">최근 사용한 주소</div>
                                {history.map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setUrl(h);
                                            setShowHistory(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors truncate block"
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-[#39FF14] text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#32d912] disabled:opacity-50 flex items-center gap-2 whitespace-nowrap transition-colors h-10"
                    >
                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isSyncing ? '동기화 중...' : '가져오기'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-1
                    ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                `}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}
        </div>
    );
}
