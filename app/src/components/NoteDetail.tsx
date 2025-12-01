import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar } from 'lucide-react';

interface NoteDetailProps {
    content: string;
    dueDate?: string;
    quadrant?: number;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ content, dueDate, quadrant }) => {
    const getQuadrantInfo = (q?: number) => {
        switch (q) {
            case 1: return { name: 'Do First', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
            case 2: return { name: 'Schedule', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
            case 3: return { name: 'Delegate', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
            case 4: return { name: 'Don\'t Do', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
            default: return { name: 'Inbox', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
        }
    };

    const quadrantInfo = getQuadrantInfo(quadrant);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/30">
            <div className="max-w-3xl mx-auto p-8">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${quadrantInfo.color}`}>
                        <div className={`w-2 h-2 rounded-full bg-current opacity-60`} />
                        <span>{quadrantInfo.name}</span>
                    </div>
                    {dueDate && (
                        <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium bg-white/5 px-2 py-1 rounded-md flex-shrink-0">
                            <Calendar size={12} />
                            <span>{new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    )}
                </div>
                <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content || ''}
                    </ReactMarkdown>
                    {!content && (
                        <p className="text-slate-600 italic mt-4">No content.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteDetail;
