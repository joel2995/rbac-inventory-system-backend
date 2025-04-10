const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// 🔹 Function to Sign JWT Token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// ✅ Register a New User
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, contactnumber, address } = req.body;

        // 🔹 Check if User Already Exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // 🔹 Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Create New User
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            contactnumber,
            address,
        });

        const token = signToken(user._id);

        res.status(201).json({
            status: "success",
            token,
            data: { user },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ User Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // 🔹 Find User by Email and Check Password
        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Incorrect email or password" });
        }

        const token = signToken(user._id);

        res.status(200).json({
            status: "success",
            token,
            role: user.role,
            message: "Login successful",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Retrieve All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: "success",
            count: users.length,
            data: { users },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Retrieve a Specific User by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            status: "success",
            data: { user },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Update a User by ID
exports.updateUserById = async (req, res) => {
    try {
        const { name, email, role, contactnumber, address } = req.body;

        // 🔹 If email is being updated, check for duplicates
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: "Email already in use by another user" });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, contactnumber, address },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            status: "success",
            message: "User updated successfully!",
            data: { updatedUser },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Delete a User by ID
exports.deleteUserById = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            status: "success",
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
