import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Quadrant from '../components/Quadrant';
import NoteEditor from '../components/NoteEditor';
import Note from '../components/Note';
import ArchivedNote from '../components/ArchivedNote';
import ConfirmModal from '../components/ConfirmModal';
import { LogOut, LayoutGrid, User } from 'lucide-react';

interface NoteData {
    id: string;
    title: string;
    description?: string;
    content: string;
    quadrant: number;
    position: number;
    dueDate?: string;
    is_archived?: number;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

const Dashboard: React.FC = () => {
    const { logout, user } = useAuth();
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<NoteData | undefined>(undefined);

    const [viewMode, setViewMode] = useState<'matrix' | 'archive'>('matrix');
    const [initialQuadrant, setInitialQuadrant] = useState<number>(0);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [isLoading, setIsLoading] = useState(false);

    const handleViewChange = (mode: 'matrix' | 'archive') => {
        if (mode === viewMode) return;
        setViewMode(mode); // Just change view, data is already there
    };

    // Helper to map server response to client model
    const mapNoteResponse = (n: any): NoteData => ({
        ...n,
        dueDate: n.due_date,
        isArchived: n.is_archived
    });

    useEffect(() => {
        const loadNotes = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Active Notes (Fast)
                const activeRes = await api.get('/notes?archived=false');
                const activeNotes = activeRes.data.map(mapNoteResponse);
                setNotes(activeNotes);
                setIsLoading(false); // Show UI immediately

                // 2. Fetch Archived Notes (Background)
                const archivedRes = await api.get('/notes?archived=true');
                const archivedNotes = archivedRes.data.map(mapNoteResponse);

                setNotes(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const newNotes = archivedNotes.filter((n: any) => !existingIds.has(n.id));
                    return [...prev, ...newNotes];
                });
            } catch (err) {
                console.error('Failed to fetch notes', err);
                setIsLoading(false);
            }
        };
        loadNotes();
    }, []); // Only fetch on mount



    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeNote = notes.find(n => n.id === activeId);
        const overNote = notes.find(n => n.id === overId);

        if (!activeNote) return;

        const overContainerId = overId.toString();
        if (["0", "1", "2", "3", "4"].includes(overContainerId)) {
            const newQuadrant = parseInt(overContainerId);
            if (activeNote.quadrant !== newQuadrant) {
                setNotes((prev) => {
                    return prev.map(n =>
                        n.id === activeId
                            ? { ...n, quadrant: newQuadrant }
                            : n
                    );
                });
            }
        }
        else if (overNote && activeNote.quadrant !== overNote.quadrant) {
            setNotes((prev) => {
                return prev.map(n =>
                    n.id === activeId
                        ? { ...n, quadrant: overNote.quadrant }
                        : n
                );
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeNote = notes.find(n => n.id === activeId);
        if (!activeNote) return;

        let newQuadrant = activeNote.quadrant;

        if (["0", "1", "2", "3", "4"].includes(overId)) {
            newQuadrant = parseInt(overId);
        } else {
            const overNote = notes.find(n => n.id === overId);
            if (overNote) {
                newQuadrant = overNote.quadrant;
            }
        }

        if (activeNote.quadrant === newQuadrant) return;

        const targetCount = notes.filter(n => n.quadrant === newQuadrant && n.id !== activeId && !n.is_archived).length;
        if (newQuadrant !== 0 && targetCount >= 10) {
            alert("Maximum 10 notes allowed per quadrant!");
            // Revert state if needed (though drag overlay handles visual revert usually)
            return;
        }

        // Optimistic update
        const previousNotes = [...notes];
        setNotes(prev => prev.map(n =>
            n.id === activeId ? { ...n, quadrant: newQuadrant } : n
        ));

        try {
            await api.put(`/notes/${activeId}`, {
                quadrant: newQuadrant,
            });
            // No fetchNotes needed
        } catch (err) {
            console.error("Move failed", err);
            setNotes(previousNotes); // Revert on failure
            alert("Failed to move note");
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveNote = async (data: { title: string; description?: string; content: string; dueDate?: string }) => {
        setIsSaving(true);
        try {
            const payload = {
                ...data,
                due_date: data.dueDate,
            };

            if (editingNote) {
                // Optimistic Update for Editing
                const optimisticNote = {
                    ...editingNote,
                    ...data,
                    dueDate: data.dueDate,
                };

                // Update UI immediately
                setNotes(prev => prev.map(n => n.id === editingNote.id ? optimisticNote : n));
                setEditingNote(optimisticNote);

                // Send to server
                const response = await api.put(`/notes/${editingNote.id}`, payload);
                const mappedNote = mapNoteResponse(response.data);

                // Update with server response to ensure consistency (e.g. if server modified something)
                setNotes(prev => prev.map(n => n.id === mappedNote.id ? mappedNote : n));
                setEditingNote(mappedNote);
            } else {
                // For new notes, we wait for server ID, but show loading state
                const response = await api.post('/notes', { ...payload, quadrant: initialQuadrant });
                const mappedNote = mapNoteResponse(response.data);

                setNotes(prev => [...prev, mappedNote]);
                setEditingNote(mappedNote);
                setInitialQuadrant(0);
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save note');
            // If it was an optimistic update, we should revert here (complex to implement perfectly without history, 
            // but for now the user will see the error and can try again or refresh)
            if (editingNote) {
                // Optionally revert to original state if we had it saved separately, 
                // but since we updated state in place, a refresh might be needed or we just leave it 
                // as "unsaved changes" in the UI. 
                // For this MVP, the alert is the primary feedback.
            }
        } finally {
            setIsSaving(false);
        }
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    const handleDeleteNote = (id: string) => {
        setNoteToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteNote = async () => {
        if (!noteToDelete) return;

        // Optimistic update
        const previousNotes = [...notes];
        setNotes(prev => prev.filter(n => n.id !== noteToDelete));

        try {
            await api.delete(`/notes/${noteToDelete}`);
        } catch (err) {
            console.error(err);
            // Revert on failure
            setNotes(previousNotes);
            alert('Failed to delete note');
        } finally {
            setNoteToDelete(null);
        }
    };

    const handleArchiveNote = async (note: NoteData) => {
        // Optimistic update: Toggle is_archived instead of removing
        const previousNotes = [...notes];
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_archived: 1 } : n));

        try {
            await api.put(`/notes/${note.id}`, { is_archived: 1 });
        } catch (err) {
            console.error('Archive failed', err);
            setNotes(previousNotes); // Revert
            alert('Failed to archive note');
        }
    };

    const handleUnarchiveNote = async (note: NoteData) => {
        // Optimistic update: Toggle is_archived instead of removing
        const previousNotes = [...notes];
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_archived: 0 } : n));

        try {
            await api.put(`/notes/${note.id}`, { is_archived: 0 });
        } catch (err) {
            console.error('Unarchive failed', err);
            setNotes(previousNotes); // Revert
            alert('Failed to restore note');
        }
    };

    const handleAddNote = (quadrantId: number) => {
        setInitialQuadrant(quadrantId);
        setEditingNote(undefined);
        setIsEditorOpen(true);
    };

    const getNotes = (quadrant: number) => {
        const isArchivedView = viewMode === 'archive';
        return notes
            .filter(n => {
                const noteIsArchived = (n as any).is_archived === 1;
                return n.quadrant === quadrant && (isArchivedView ? noteIsArchived : !noteIsArchived);
            })
            .sort((a, b) => {
                // Prioritize notes with due dates
                if (a.dueDate && !b.dueDate) return -1;
                if (!a.dueDate && b.dueDate) return 1;

                // Sort by due date (ascending - imminent first)
                if (a.dueDate && b.dueDate) {
                    const dateA = new Date(a.dueDate).getTime();
                    const dateB = new Date(b.dueDate).getTime();
                    if (dateA !== dateB) return dateA - dateB;
                }

                // Fallback to position
                return a.position - b.position;
            });
    };
    const activeNote = activeId ? notes.find(n => n.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
                {/* Sidebar - Unclassified */}
                <div className="w-80 bg-slate-900/80 border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl backdrop-blur-xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600/20 rounded-lg">
                                <LayoutGrid className="text-blue-500" size={20} />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Eisenhower</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10" title={user?.nickname}>
                                <User size={14} className="text-slate-400" />
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1 overflow-hidden flex flex-col">
                        <div className="flex space-x-2 mb-6">
                            <button
                                onClick={() => handleViewChange('matrix')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'matrix' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                Matrix
                            </button>
                            <button
                                onClick={() => handleViewChange('archive')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'archive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                Archive
                            </button>
                        </div>

                        {viewMode === 'matrix' && (
                            <>
                                <div className="flex-1 min-h-0 flex flex-col">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Inbox</h3>
                                    <div className="flex-1 min-h-0">
                                        <Quadrant
                                            id="0"
                                            title="Unclassified"
                                            notes={getNotes(0)}
                                            colorClass="text-slate-300"
                                            bgClass="bg-transparent border-dashed border-slate-800"
                                            onEditNote={(n) => { setEditingNote(n); setIsEditorOpen(true); }}
                                            onDeleteNote={handleDeleteNote}
                                            onAddNote={handleAddNote}
                                            onArchiveNote={handleArchiveNote}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {viewMode === 'matrix' ? (
                        <div className="grid grid-cols-2 grid-rows-2 gap-8 h-full relative z-10">
                            <Quadrant
                                id="1"
                                title="Do First"
                                subtitle="Urgent & Important"
                                notes={getNotes(1)}
                                colorClass="text-rose-400"
                                bgClass="from-rose-500/5 to-transparent bg-gradient-to-br"
                                onEditNote={(n) => { setEditingNote(n); setIsEditorOpen(true); }}
                                onDeleteNote={handleDeleteNote}
                                onAddNote={handleAddNote}
                                onArchiveNote={handleArchiveNote}
                            />
                            <Quadrant
                                id="2"
                                title="Schedule"
                                subtitle="Not Urgent & Important"
                                notes={getNotes(2)}
                                colorClass="text-sky-400"
                                bgClass="from-sky-500/5 to-transparent bg-gradient-to-bl"
                                onEditNote={(n) => { setEditingNote(n); setIsEditorOpen(true); }}
                                onDeleteNote={handleDeleteNote}
                                onAddNote={handleAddNote}
                                onArchiveNote={handleArchiveNote}
                            />
                            <Quadrant
                                id="3"
                                title="Delegate"
                                subtitle="Urgent & Not Important"
                                notes={getNotes(3)}
                                colorClass="text-amber-400"
                                bgClass="from-amber-500/5 to-transparent bg-gradient-to-tr"
                                onEditNote={(n) => { setEditingNote(n); setIsEditorOpen(true); }}
                                onDeleteNote={handleDeleteNote}
                                onAddNote={handleAddNote}
                                onArchiveNote={handleArchiveNote}
                            />
                            <Quadrant
                                id="4"
                                title="Don't Do"
                                subtitle="Not Urgent & Not Important"
                                notes={getNotes(4)}
                                colorClass="text-slate-400"
                                bgClass="from-slate-500/5 to-transparent bg-gradient-to-tl"
                                onEditNote={(n) => { setEditingNote(n); setIsEditorOpen(true); }}
                                onDeleteNote={handleDeleteNote}
                                onAddNote={handleAddNote}
                                onArchiveNote={handleArchiveNote}
                            />
                        </div>
                    ) : (
                        <div className="h-full relative z-10 overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-bold text-white mb-6">Archived Notes</h2>
                            <div className="space-y-8">
                                {[1, 2, 3, 4, 0].map(quadrantId => {
                                    const quadrantNotes = getNotes(quadrantId);
                                    if (quadrantNotes.length === 0) return null;

                                    const quadrantNames: { [key: number]: string } = {
                                        1: 'Do First',
                                        2: 'Schedule',
                                        3: 'Delegate',
                                        4: "Don't Do",
                                        0: 'Unclassified'
                                    };

                                    const quadrantColors: { [key: number]: string } = {
                                        1: 'text-rose-400',
                                        2: 'text-sky-400',
                                        3: 'text-amber-400',
                                        4: 'text-slate-400',
                                        0: 'text-slate-300'
                                    };

                                    return (
                                        <div key={quadrantId}>
                                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center ${quadrantColors[quadrantId]}`}>
                                                <span className="w-2 h-2 rounded-full bg-current mr-2 opacity-60"></span>
                                                {quadrantNames[quadrantId]}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {quadrantNotes.map(note => (
                                                    <ArchivedNote
                                                        key={note.id}
                                                        id={note.id}
                                                        title={note.title}
                                                        description={note.description}
                                                        dueDate={note.dueDate}
                                                        onEdit={() => { setEditingNote(note); setIsEditorOpen(true); }}
                                                        onDelete={() => handleDeleteNote(note.id)}
                                                        onRestore={() => handleUnarchiveNote(note)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {notes.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                        <p>No archived notes found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeNote ? (
                    <div className="w-[calc(50vw-14rem)] opacity-90 cursor-grabbing">
                        <Note
                            id={activeNote.id}
                            title={activeNote.title}
                            description={activeNote.description}
                            dueDate={activeNote.dueDate}
                            onEdit={() => { }}
                            onDelete={() => { }}
                            hideActions={true}
                        />
                    </div>
                ) : null}
            </DragOverlay>

            <NoteEditor
                key={editingNote ? editingNote.id : 'new-note'}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveNote}
                initialData={editingNote}
                isSaving={isSaving}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteNote}
                title="Delete Note"
                message="Are you sure you want to delete this note? This action cannot be undone."
                confirmText="Delete"
                isDestructive={true}
            />
        </DndContext>
    );
};

export default Dashboard;
