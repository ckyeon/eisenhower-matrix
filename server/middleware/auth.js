const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    console.warn('WARNING: JWT_SECRET is not defined in environment variables.');
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be defined in production environment.');
    }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        console.log('Auth successful for user:', decoded.id);
        next();
    } catch (err) {
        console.error('Auth failed:', err.message);
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = { authenticateToken, SECRET_KEY };
