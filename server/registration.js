const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const path = require("path");
const SECRET_KEY = "your_secret_key";
const usersFile = path.join(__dirname, "users.json");

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

const registrationRouter = express.Router();

registrationRouter.post(
    "/register",
    [
        body("login").isLength({ min: 3 }).withMessage("Логин пользователя должен быть не менее 3 символов"),
        body("password").isLength({ min: 6 }).withMessage("Пароль должен быть не менее 6 символов"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { login,username,lastName,stud_group,password } = req.body;
        try {
            const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
            const existingUser = users.find((user) => user.login === login);
            if (existingUser) {
                return res.status(400).send("Пользователь с таким именем уже существует");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: Date.now().toString(),
                login,
                username,
                lastName,
                stud_group,
                password: hashedPassword,
                role: "user",
                group: "none",
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

registrationRouter.post("/login", async (req, res) => {
    const { login, password } = req.body;
    try {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.login === login);
        if (!user) {
            return res.status(401).send("Неверное имя пользователя или пароль");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send("Неверное имя пользователя или пароль");
        }
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token, role: user.role, login: user.login });
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
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === decoded.id);
        res.json({ login: user.login, role: user.role, group: user.group });
    });
});


module.exports = registrationRouter;
