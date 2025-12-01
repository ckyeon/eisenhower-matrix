const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);

app.get('/', (req, res) => {
    res.send('Eisenhower Matrix Note API');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
