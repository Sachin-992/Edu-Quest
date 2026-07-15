import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image, FileSpreadsheet, File } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    onClose: () => void;
    userRole: string;
}

const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

const MAX_SIZE_MB = 10;

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onClose, userRole }) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <Image className="w-8 h-8 text-purple-500" />;
        if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
            return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        if (type.includes('pdf') || type.includes('word') || type.includes('document'))
            return <FileText className="w-8 h-8 text-red-500" />;
        return <File className="w-8 h-8 text-slate-500" />;
    };

    const validateFile = (file: File): boolean => {
        setError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('File type not supported. Please upload PDF, Word, Excel, PowerPoint, CSV, or images.');
            return false;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            return false;
        }

        return true;
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-800">Upload File</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="mb-3 text-xs text-slate-500 bg-indigo-50 p-2 rounded-lg">
                        <span className="font-semibold text-indigo-700">Role: {userRole}</span> — Files will be processed according to your access level.
                    </div>

                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={handleClick}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept={ALLOWED_TYPES.join(',')}
                            onChange={handleChange}
                        />

                        <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>

                        <p className="text-slate-700 font-medium mb-1">
                            Drag & drop your file here
                        </p>
                        <p className="text-slate-500 text-sm mb-3">
                            or click to browse
                        </p>

                        <div className="flex justify-center gap-2 flex-wrap">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">PDF</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">Word</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">Excel</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">Images</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">CSV</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <p className="mt-3 text-[10px] text-slate-400 text-center">
                        Maximum file size: {MAX_SIZE_MB}MB. Files are processed securely and not stored permanently.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
