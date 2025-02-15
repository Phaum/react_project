const express = require("express");
const fs = require("fs");
const path = require("path");
const { authenticateToken, authorizeRole } = require("./middleware");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const usersFile = path.join(__dirname, "users.json");
const groupsFile = path.join(__dirname, "groups.json");

router.get("/", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Ошибка чтения пользователей" });
    }
});

router.put("/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    const { id } = req.params;
    const { username, role } = req.body;
    try {
        let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        const userIndex = users.findIndex((user) => user.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        users[userIndex].username = username;
        users[userIndex].role = role;
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        res.status(200).json({ message: "Пользователь обновлен" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при обновлении" });
    }
});

router.delete("/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    const { id } = req.params;
    try {
        let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        users = users.filter((user) => user.id !== id);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        res.status(200).json({ message: "Пользователь удален" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при удалении" });
    }
});

router.patch("/:id/reset-password", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const indexPath = path.join(__dirname, "users.json");
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
    }
    try {
        let users = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        const userIndex = users.findIndex((user) => user.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        users[userIndex].password = hashedPassword;
        fs.writeFileSync(indexPath, JSON.stringify(users, null, 2));
        res.status(200).json({ message: "Пароль успешно изменен" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при изменении пароля" });
    }
});

router.get("/groups", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    try {
        const groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при получении списка групп" });
    }
});

router.post("/groups", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    const { newGroup } = req.body;
    if (!newGroup) {
        return res.status(400).json({ message: "Название группы не может быть пустым" });
    }
    try {
        let groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        if (groups.includes(newGroup)) {
            return res.status(400).json({ message: "Такая группа уже существует" });
        }
        groups.push(newGroup);
        fs.writeFileSync(groupsFile, JSON.stringify(groups, null, 2));
        res.status(201).json({ message: "Группа успешно добавлена", groups });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при добавлении группы" });
    }
});

router.put("/:id/group", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    const { id } = req.params;
    const { newGroup } = req.body;
    try {
        let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        let groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        const user = users.find(user => user.id === id);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        if (!groups.includes(newGroup)) {
            return res.status(400).json({ message: "Группа не найдена" });
        }
        user.group = newGroup;
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        res.status(200).json({ message: "Группа пользователя обновлена", user });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при обновлении группы пользователя" });
    }
});

router.post("/create", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    const { username, password, role, group } = req.body;
    const indexPath = path.join(__dirname, "users.json");
    if (!username || !password || password.length < 6 || !role) {
        return res.status(400).json({ message: "Все поля обязательны! Пароль минимум 6 символов." });
    }
    try {
        let users = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        let groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        if (users.some(user => user.username === username)) {
            return res.status(400).json({ message: "Такой пользователь уже существует" });
        }
        if (!groups.includes(group)) {
            return res.status(400).json({ message: "Указанная группа не существует" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            role,
            group
        };
        users.push(newUser);
        fs.writeFileSync(indexPath, JSON.stringify(users, null, 2));
        res.status(201).json({ message: "Пользователь создан успешно", user: { id: newUser.id, username, role } });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при создании пользователя" });
    }
});

router.delete("/groups/:groupName", authenticateToken, authorizeRole(["admin"]), (req, res) => {
    const { groupName } = req.params;
    try {
        let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        let groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        const usersInGroup = users.some((user) => user.group === groupName);
        if (usersInGroup) {
            return res.status(400).json({ message: "Нельзя удалить группу, в которой есть пользователи!" });
        }
        groups = groups.filter((group) => group !== groupName);
        fs.writeFileSync(groupsFile, JSON.stringify(groups, null, 2));
        res.status(200).json({ message: "Группа успешно удалена", groups });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при удалении группы" });
    }
});

module.exports = router;
