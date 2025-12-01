import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Note from './Note';
import { Plus } from 'lucide-react';


interface NoteData {
    id: string;
    title: string;
    description?: string;
    content: string;
    quadrant: number;
    position: number;
    dueDate?: string;
}

interface QuadrantProps {
    id: string;
    title: string;
    subtitle?: string;
    notes: NoteData[];
    colorClass: string; // Text color class
    bgClass: string; // Background tint class
    onEditNote: (note: NoteData) => void;
    onDeleteNote: (id: string) => void;
    onAddNote?: (quadrantId: number) => void;
    onArchiveNote?: (note: NoteData) => void;
}

const Quadrant: React.FC<QuadrantProps> = ({
    id,
    title,
    subtitle,
    notes,
    colorClass,
    bgClass,
    onEditNote,
    onDeleteNote,
    onAddNote,
    onArchiveNote
}) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full rounded-2xl glass-panel shadow-xl overflow-hidden transition-all duration-300 hover:border-white/10 ${bgClass}`}
        >
            <div className={`p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/20`}>
                <div>
                    <h2 className={`text-lg font-bold tracking-tight ${colorClass} flex items-center`}>
                        {title}
                        <span className="ml-2 text-xs font-medium bg-white/5 px-2 py-0.5 rounded-full text-slate-400 border border-white/5">
                            {notes.length}
                        </span>
                    </h2>
                    {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
                </div>
                {onAddNote && (
                    <button
                        onClick={() => onAddNote(parseInt(id))}
                        className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors btn-hover ${colorClass}`}
                        title="Add Note"
                    >
                        <Plus size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                <SortableContext items={notes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                    {notes.map((note) => (
                        <Note
                            key={note.id}
                            id={note.id}
                            title={note.title}
                            description={note.description}
                            dueDate={note.dueDate}
                            onEdit={() => onEditNote(note)}
                            onDelete={() => onDeleteNote(note.id)}
                            onArchive={onArchiveNote ? () => onArchiveNote(note) : undefined}
                        />
                    ))}
                </SortableContext>
                {notes.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                            <span className="text-2xl font-light">+</span>
                        </div>
                        <p className="text-sm font-medium">Drop notes here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Quadrant;
