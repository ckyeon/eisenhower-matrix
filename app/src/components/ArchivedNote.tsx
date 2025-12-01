import React from 'react';
import { Trash2, Clock, ArchiveRestore } from 'lucide-react';

interface ArchivedNoteProps {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    onEdit: () => void;
    onDelete: () => void;
    onRestore: () => void;
}

const ArchivedNote: React.FC<ArchivedNoteProps> = ({
    title,
    description,
    dueDate,
    onEdit,
    onDelete,
    onRestore,
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div
            onClick={onEdit}
            className="group relative glass-card p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
        >
            {/* Hover Actions Overlay */}
            <div className="absolute bottom-2 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/90 rounded-lg p-1 backdrop-blur-sm z-20">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRestore();
                    }}
                    className="p-1.5 hover:bg-blue-500/20 rounded-md text-slate-300 hover:text-blue-400 transition-colors"
                    title="Restore"
                >
                    <ArchiveRestore size={12} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-300 hover:text-red-400 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-base text-slate-100 truncate pr-2 flex-1">{title}</h3>
                {dueDate && (
                    <div className="flex items-center text-[11px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/5 shrink-0 ml-2">
                        <Clock size={10} className="mr-1" />
                        {formatDate(dueDate)}
                    </div>
                )}
            </div>

            {description && (
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                    {description}
                </p>
            )}
        </div>
    );
};

export default ArchivedNote;
