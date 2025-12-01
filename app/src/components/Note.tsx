import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Clock, CheckCircle } from 'lucide-react';


interface NoteProps {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    onEdit: () => void;
    onDelete: () => void;
    onArchive?: () => void;
    hideActions?: boolean;
}

const Note: React.FC<NoteProps> = ({ id, title, description, dueDate, onEdit, onDelete, onArchive, hideActions }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onEdit}
            className="group relative glass-card p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:cursor-grabbing group"
        >
            {/* Hover Actions Overlay */}
            {!hideActions && (
                <div className="absolute bottom-2 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/90 rounded-lg p-1 backdrop-blur-sm z-20">
                    {onArchive && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onArchive();
                            }}
                            className="p-1.5 hover:bg-blue-500/20 rounded-md text-slate-300 hover:text-blue-400 transition-colors"
                            title="Archive"
                        >
                            <CheckCircle size={12} />
                        </button>
                    )}
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
            )}

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

export default Note;
