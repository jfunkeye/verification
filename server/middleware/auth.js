const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        let token = req.headers['authorization'];

        // No token provided
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access denied. No token provided.'
            });
        }

        // Remove "Bearer " prefix if included
        if (token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        
        req.user = decoded; 

        next(); 

    } catch (err) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token'
        });
    }
};
