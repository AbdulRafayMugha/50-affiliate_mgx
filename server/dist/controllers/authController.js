"use strict";
// src/controllers/authController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.getProfile = exports.login = exports.register = void 0;
const tslib_1 = require("tslib");
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const db_1 = tslib_1.__importDefault(require("../db")); // will now use .env vars
const uuid_1 = require("uuid");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// ---------------- REGISTER ----------------
const register = async (req, res) => {
    const { email, password, name, referralCode } = req.body;
    try {
        // 1. Check if email already exists
        const existingUser = await db_1.default.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }
        // 2. Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // 3. Handle referral
        let referrerId = null;
        if (referralCode) {
            const referrer = await db_1.default.query("SELECT id FROM users WHERE referral_code = $1", [referralCode]);
            if (referrer.rows.length === 0) {
                return res.status(400).json({ error: "Invalid referral code" });
            }
            referrerId = referrer.rows[0].id;
        }
        // 4. Generate unique referral code for new user
        const newReferralCode = (0, uuid_1.v4)();
        // 5. Insert new user
        const newUser = await db_1.default.query(`INSERT INTO users (email, password_hash, name, role, referrer_id, referral_code, tier, is_active, email_verified)
       VALUES ($1, $2, $3, 'affiliate', $4, $5, 'Bronze', true, false)
       RETURNING id, email, name, referral_code, role, referrer_id`, [email, passwordHash, name, referrerId, newReferralCode]);
        // 6. Return success
        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0],
        });
    }
    catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
};
exports.register = register;
// ---------------- LOGIN ----------------
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Find user
        const userResult = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const user = userResult.rows[0];
        // 2. Verify password
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        // 3. Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        // 4. Send response
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                referral_code: user.referral_code,
                referrer_id: user.referrer_id,
                tier: user.tier,
            },
        });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
};
exports.login = login;
// ---------------- GET PROFILE ----------------
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const userResult = await db_1.default.query(`SELECT id, email, name, role, referral_code, referrer_id, tier, is_active, email_verified, created_at
       FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user: userResult.rows[0] });
    }
    catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ error: "Server error while fetching profile" });
    }
};
exports.getProfile = getProfile;
// ---------------- VERIFY TOKEN ----------------
const verifyToken = (req, res) => {
    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({ valid: true, decoded });
    }
    catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=authController.js.map