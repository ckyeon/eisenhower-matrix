import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-6 animate-scale-in">
                <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${isDestructive ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>

                <p className="text-slate-400 mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-white transition-all shadow-lg ${isDestructive
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
