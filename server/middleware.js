const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";
const usersFile = path.join(__dirname, "users.json");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Требуется авторизация" });
    }
    jwt.verify(token, SECRET_KEY, (err, decodedToken) => {
        if (err) {
            return res.status(403).json({ message: "Недействительный токен" });
        }
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === decodedToken.id);
        if (!user) {
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        req.user = { id: user.id, role: user.role, group: user.group };
        next();
    });
};

const authorizeRole = (roles) => (req, res, next) => {
    const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    const user = users.find((u) => u.id === req.user.id);

    if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Доступ запрещён" });
    }

    next();
};

module.exports = { authenticateToken, authorizeRole };