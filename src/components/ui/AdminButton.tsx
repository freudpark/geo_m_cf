'use client';

import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminButton() {
    const router = useRouter();

    const handleClick = () => {
        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password && password.toLowerCase() === 'pyhgoshift') {
            router.push('/admin');
        } else if (password) {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };

    return (
        <button
            onClick={handleClick}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="관리자 설정"
        >
            <Settings className="w-5 h-5" />
        </button>
    );
}
