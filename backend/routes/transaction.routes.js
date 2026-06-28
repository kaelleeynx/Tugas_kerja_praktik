const express = require('express');
const router = express.Router();

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(403).json({ success: false, message: 'No token provided' });
    }

    const token = bearerHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Get all transactions
router.get('/', verifyToken, (req, res) => {
    const query = `
        SELECT t.*, u.username, u.name as user_name 
        FROM transactions t 
        JOIN users u ON t.user_id = u.id 
        ${req.user.role === 'staff' ? 'WHERE t.user_id = ?' : ''}
        ORDER BY t.created_at DESC
    `;

    const params = req.user.role === 'staff' ? [req.user.id] : [];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, data: results });
    });
});

// Create transaction
router.post('/', verifyToken, (req, res) => {
    const { type, amount, description } = req.body;
    
    const query = 'INSERT INTO transactions (type, amount, description, user_id) VALUES (?, ?, ?, ?)';
    db.query(query, [type, amount, description, req.user.id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(201).json({
            success: true,
            message: 'Nota berhasil ditambahkan',
            data: {
                id: results.insertId,
                type,
                amount,
                description,
                user_id: req.user.id
            }
        });
    });
});

// Delete transaction
router.delete('/:id', verifyToken, (req, res) => {
    const query = `
        DELETE FROM transactions 
        WHERE id = ? ${req.user.role === 'staff' ? 'AND user_id = ?' : ''}
    `;

    const params = [req.params.id];
    if (req.user.role === 'staff') {
        params.push(req.user.id);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nota tidak ditemukan atau Anda tidak memiliki akses' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Nota berhasil dihapus' 
        });
    });
});

module.exports = router;