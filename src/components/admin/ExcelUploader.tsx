'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadTargets } from '@/actions';
import { Target } from '@/lib/db';

export default function ExcelUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [preview, setPreview] = useState<any[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            setPreview(jsonData.slice(0, 5)); // Show first 5 rows
        };

        reader.readAsArrayBuffer(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const handleUpload = async () => {
        if (preview.length === 0) return;
        setIsUploading(true);
        setMessage(null);

        try {
            // Map Korean headers to English keys
            const targets = preview.map((row: any) => ({
                name: row['홈페이지명'] || row['사이트명'] || 'Unknown',
                url: row['URL'] || row['주소'],
                was_cnt: parseInt(row['WAS'] || row['WAS수'] || '0'),
                web_cnt: parseInt(row['WEB'] || row['WEB수'] || '0'),
                db_info: row['DB'] || row['DB정보'] || '',
                // Keyword removed as per user request
                keyword: undefined,
                interval: parseInt(row['점검주기'] || '5'),
                is_active: 1,
                category: row['구분'] || row['분류'] || '지역교육청'
            })).filter((t: any) => t.url); // Filter out rows without URL

            if (targets.length === 0) {
                throw new Error('유효한 데이터가 없습니다. 엑셀 헤더를 확인해주세요. (홈페이지명, URL)');
            }

            const result = await uploadTargets(targets);
            if (result.success) {
                setMessage({ type: 'success', text: `${targets.length}개의 사이트가 등록되었습니다.` });
                setPreview([]);
            } else {
                setMessage({ type: 'error', text: result.error || '업로드 실패' });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || '업로드 중 오류 발생' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-slate-700 hover:border-slate-500'}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileUp className="w-10 h-10 mb-2" />
                    {isDragActive ? (
                        <p className="text-[#39FF14] font-bold">여기에 파일을 놓으세요</p>
                    ) : (
                        <>
                            <p className="font-medium text-slate-200">엑셀 파일을 이곳에 드래그하거나 클릭하여 업로드하세요</p>
                            <p className="text-sm">지원 형식: .xlsx, .xls</p>
                        </>
                    )}
                </div>
            </div>

            {preview.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-300">미리보기 (상위 5개)</h4>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="bg-[#39FF14] text-slate-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-[#32d912] disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isUploading ? '등록 중...' : '등록하기'}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-400">
                            <thead className="bg-slate-800 text-slate-200 uppercase">
                                <tr>
                                    <th className="px-3 py-2">홈페이지명</th>
                                    <th className="px-3 py-2">URL</th>
                                    <th className="px-3 py-2">WAS</th>
                                    <th className="px-3 py-2">WEB</th>
                                    <th className="px-3 py-2">DB</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-700">
                                        <td className="px-3 py-2">{row['홈페이지명'] || row['사이트명']}</td>
                                        <td className="px-3 py-2">{row['URL'] || row['주소']}</td>
                                        <td className="px-3 py-2">{row['WAS'] || row['WAS수']}</td>
                                        <td className="px-3 py-2">{row['WEB'] || row['WEB수']}</td>
                                        <td className="px-3 py-2">{row['DB'] || row['DB정보']}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 text-sm font-medium
                    ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                `}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}
        </div>
    );
}
