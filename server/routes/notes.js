const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all notes for the user
router.get('/', (req, res) => {
    try {
        let query = 'SELECT * FROM notes WHERE user_id = ?';
        const params = [req.user.id];

        if (req.query.all !== 'true') {
            const isArchived = req.query.archived === 'true' ? 1 : 0;
            query += ' AND is_archived = ?';
            params.push(isArchived);
        }

        query += ' ORDER BY quadrant ASC, position ASC, created_at DESC';

        const stmt = db.prepare(query);
        const notes = stmt.all(...params);
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Create a new note
router.post('/', (req, res) => {
    console.log('POST /notes body:', req.body);
    const { title, description, content, quadrant, due_date } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    // Check limit per quadrant (10 notes)
    // Only if quadrant is not 0 (Unclassified)
    if (quadrant !== 0) {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND quadrant = ?');
        const { count } = countStmt.get(req.user.id, quadrant);
        if (count >= 10) {
            return res.status(400).json({ error: 'Maximum 10 notes allowed per quadrant.' });
        }
    }

    try {
        const id = uuidv4();
        const stmt = db.prepare(`
      INSERT INTO notes (id, user_id, title, description, content, quadrant, due_date, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        // Get max position for the quadrant to append to end
        const posStmt = db.prepare('SELECT MAX(position) as maxPos FROM notes WHERE user_id = ? AND quadrant = ?');
        const { maxPos } = posStmt.get(req.user.id, quadrant || 0);
        const position = (maxPos || 0) + 1;

        stmt.run(id, req.user.id, title, description || '', content || '', quadrant || 0, due_date || null, position);

        const newNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
        res.status(201).json(newNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Update a note
router.put('/:id', (req, res) => {
    console.log(`PUT /notes/${req.params.id} body:`, req.body);
    const { title, description, content, quadrant, due_date } = req.body;
    const { id } = req.params;

    try {
        // Check ownership
        const checkStmt = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
        const note = checkStmt.get(id, req.user.id);

        if (!note) {
            return res.status(404).json({ error: 'Note not found.' });
        }

        // If moving quadrant, check limit
        if (quadrant !== undefined && quadrant !== note.quadrant && quadrant !== 0) {
            const countStmt = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND quadrant = ?');
            const { count } = countStmt.get(req.user.id, quadrant);
            if (count >= 10) {
                return res.status(400).json({ error: 'Maximum 10 notes allowed per quadrant.' });
            }
        }

        const updateFields = [];
        const params = [];

        if (title !== undefined) { updateFields.push('title = ?'); params.push(title); }
        if (description !== undefined) { updateFields.push('description = ?'); params.push(description); }
        if (content !== undefined) { updateFields.push('content = ?'); params.push(content); }
        if (quadrant !== undefined) { updateFields.push('quadrant = ?'); params.push(quadrant); }
        if (due_date !== undefined) { updateFields.push('due_date = ?'); params.push(due_date); }
        if (req.body.is_archived !== undefined) { updateFields.push('is_archived = ?'); params.push(req.body.is_archived); }

        if (updateFields.length === 0) {
            return res.json(note);
        }

        params.push(id);
        params.push(req.user.id);

        const updateStmt = db.prepare(`UPDATE notes SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`);
        updateStmt.run(...params);

        const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
        res.json(updatedNote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Delete a note
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const stmt = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
        const result = stmt.run(id, req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Note not found.' });
        }

        res.json({ message: 'Note deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Reorder notes (Batch update positions)
router.put('/reorder/batch', (req, res) => {
    const { updates } = req.body; // Array of { id, position, quadrant }

    if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'Updates must be an array.' });
    }

    const updateStmt = db.prepare('UPDATE notes SET position = ?, quadrant = ? WHERE id = ? AND user_id = ?');

    const transaction = db.transaction((notes) => {
        for (const note of notes) {
            updateStmt.run(note.position, note.quadrant, note.id, req.user.id);
        }
    });

    try {
        transaction(updates);
        res.json({ message: 'Notes reordered successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
