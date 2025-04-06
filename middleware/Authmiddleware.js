const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token." });
    }
};

module.exports = authMiddleware;
