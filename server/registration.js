const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const path = require("path");
const SECRET_KEY = "your_secret_key";
const usersFile = "./users.json";

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

const registrationRouter = express.Router();

// Регистрация пользователя
registrationRouter.post(
    "/register",
    [
        body("username").isLength({ min: 3 }).withMessage("Имя пользователя должно быть не менее 3 символов"),
        body("password").isLength({ min: 6 }).withMessage("Пароль должен быть не менее 6 символов"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password } = req.body;
        try {
            const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
            // Проверяем существование пользователя
            const existingUser = users.find((user) => user.username === username);
            if (existingUser) {
                return res.status(400).send("Пользователь с таким именем уже существует");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: Date.now().toString(),
                username,
                password: hashedPassword,
                role: "user", // Роль по умолчанию
                group: "none", // Группа по умолчанию
            };
            users.push(newUser);
            fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
            res.json({ message: "Пользователь успешно зарегистрирован" });
        } catch (err) {
            console.error("Ошибка при обработке регистрации:", err);
            res.status(500).send("Произошла ошибка при регистрации пользователя");
        }
    }
);

// Авторизация пользователя
registrationRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.username === username);
        if (!user) {
            return res.status(401).send("Неверное имя пользователя или пароль");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send("Неверное имя пользователя или пароль");
        }
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        console.error("Ошибка при авторизации пользователя:", err);
        res.status(500).send("Произошла ошибка при авторизации");
    }
});

registrationRouter.post("/verify", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send("Требуется авторизация");
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send("Недействительный токен");
        }
        // Читаем пользователей из файла
        const usersFile = path.join(__dirname, "users.json");
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === decoded.id);
        res.json({ username: user.username, role: user.role, group: user.group }); // Возвращаем данные из токена
    });
});


module.exports = registrationRouter;
