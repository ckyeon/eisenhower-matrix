import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Pencil, Calendar } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import NoteDetail from './NoteDetail';

interface NoteEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: { title: string; description?: string; content: string; dueDate?: string; quadrant?: number }) => void;
    initialData?: {
        id: string;
        title: string;
        description?: string;
        content: string;
        dueDate?: string;
        quadrant?: number;
    };
    isSaving?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ isOpen, onClose, onSave, initialData, isSaving = false }) => {

    const formatInitialContent = (data?: { title: string; description?: string; content: string }) => {
        if (!data) return '# Untitled Note\n> Add a short description here...\n\nStart writing...';

        let newContent = data.content || '';

        // Prepend Description if it exists and isn't already in content
        if (data.description && !newContent.includes(`> ${data.description}`)) {
            const lines = newContent.split('\n');
            if (lines[0]?.startsWith('# ')) {
                lines.splice(1, 0, `> ${data.description}`, '');
                newContent = lines.join('\n');
            } else {
                newContent = `> ${data.description}\n\n${newContent}`;
            }
        }

        // Prepend Title if it exists and isn't already in content
        if (data.title && !newContent.includes(`# ${data.title}`)) {
            newContent = `# ${data.title}\n\n${newContent}`;
        }

        return newContent;
    };

    const [content, setContent] = useState(() => formatInitialContent(initialData));
    const [dueDate, setDueDate] = useState(() => initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
    const [isPreview, setIsPreview] = useState(false);
    const [isEditing, setIsEditing] = useState(!initialData);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Update state if initialData changes (though key prop in parent should handle this mostly)
    useEffect(() => {
        setContent(formatInitialContent(initialData));
        setDueDate(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
        setIsEditing(!initialData);
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        // Simple extraction for saving metadata
        const lines = content.split('\n');
        const titleLine = lines.find(line => line.startsWith('# '));
        const descLine = lines.find(line => line.startsWith('> '));

        const title = titleLine ? titleLine.substring(2).trim() : 'Untitled Note';
        const description = descLine ? descLine.substring(2).trim() : '';

        onSave({ title, description, content, dueDate, quadrant: initialData?.quadrant });
        // onClose(); // Don't close on save, let parent update initialData to switch mode
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getQuadrantInfo = (q?: number) => {
        switch (q) {
            case 1: return { name: 'Do First', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
            case 2: return { name: 'Schedule', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
            case 3: return { name: 'Delegate', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
            case 4: return { name: 'Don\'t Do', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
            default: return { name: 'Inbox', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
        }
    };

    const quadrantInfo = getQuadrantInfo(initialData?.quadrant);

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-white/10 flex flex-col h-[80vh] animate-fade-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-slate-900/50 min-h-[60px]">
                    <div className="flex-1 flex items-center overflow-hidden">
                        {isEditing ? (
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-2">
                                {initialData ? 'Editing' : 'New Note'}
                            </span>
                        ) : (
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className={`flex-shrink-0 w-3 h-3 rounded-full ${quadrantInfo.color.split(' ')[0].replace('/10', '')}`} title={quadrantInfo.name} />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                                title="Edit Note"
                            >
                                <Pencil size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    /* Edit Mode */
                    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
                        <div className="flex flex-col flex-1 min-h-0 space-y-2">
                            <div className="flex space-x-1 border-b border-white/5 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPreview(false)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!isPreview ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPreview(true)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isPreview ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Preview
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden relative rounded-xl bg-slate-950/50 border border-white/5 focus-within:border-blue-500/50 transition-colors">
                                {isPreview ? (
                                    <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                                        <div className="markdown-body">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, ...props }) => (
                                                        <a
                                                            {...props}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (props.href) {
                                                                    openUrl(props.href);
                                                                }
                                                            }}
                                                            className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                                        />
                                                    )
                                                }}
                                            >
                                                {content || '*No content*'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="# Title&#10;> Description&#10;&#10;Start writing..."
                                        className="w-full h-full bg-transparent text-slate-300 resize-none border-none focus:ring-0 outline-none font-mono p-4 leading-relaxed custom-scrollbar"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <div
                                className="relative group"
                                onClick={() => dateInputRef.current?.showPicker()}
                            >
                                <div className="flex items-center space-x-2 bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl border border-white/5 group-hover:border-white/10 transition-all cursor-pointer">
                                    <Calendar size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                                    <span className={`text-sm font-medium ${!dueDate ? 'text-slate-500' : 'text-slate-200'}`}>
                                        {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set Due Date'}
                                    </span>
                                </div>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full pointer-events-none"
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (initialData) setIsEditing(false);
                                        else onClose();
                                    }}
                                    className="px-5 py-2.5 text-slate-300 hover:text-white font-medium transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center space-x-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Note</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    /* Read-Only Detail View */
                    <NoteDetail
                        content={content}
                        dueDate={dueDate}
                        quadrant={initialData?.quadrant}
                    />
                )}
            </div>
        </div>
    );
};

export default NoteEditor;
