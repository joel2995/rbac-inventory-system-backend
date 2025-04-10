const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Protect Middleware: Ensures User is Logged In
exports.protect = async (req, res, next) => {
    try {
        let token;

        // ✅ Extract Token from Headers
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // ✅ Verify JWT Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Ensure Token is Not Expired
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        // ✅ Find User in Database & Attach to Request
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User no longer exists." });
        }

        next();
    } catch (error) {
        console.error("JWT Authentication Error:", error.message);
        res.status(403).json({ message: "Invalid or expired token." });
    }
};

// ✅ Authorization Middleware: Role-Based Access Control
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated." });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Your role (${req.user.role}) is not authorized for this action.`,
            });
        }

        next();
    };
};
