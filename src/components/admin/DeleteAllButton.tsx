'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteAllTargets } from '@/actions';

export default function DeleteAllButton() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAllTargets();
            setShowConfirm(false);
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/50 px-4 py-2 rounded-lg anime-in fade-in zoom-in-95">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-200 font-medium">정말 모든 데이터를 삭제하시겠습니까?</span>
                <div className="flex gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? '삭제 중...' : '확인'}
                    </button>
                    <button
                        onClick={() => setShowConfirm(false)}
                        disabled={isDeleting}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded font-medium transition-colors"
                    >
                        취소
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-sm transition-all hover:text-red-300"
        >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">전체 삭제</span>
        </button>
    );
}
