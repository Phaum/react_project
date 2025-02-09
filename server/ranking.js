const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // Генерация уникального ID
const rankingRouter = express.Router();

const rankingFile = path.join(__dirname, "ranking.json");

// Получение списка команд
rankingRouter.get("/", (req, res) => {
    try {
        const ranking = JSON.parse(fs.readFileSync(rankingFile, "utf8"));
        res.status(200).json(ranking);
    } catch (error) {
        res.status(500).json({ message: "Ошибка чтения данных рейтинга" });
    }
});

// Добавление новой команды
rankingRouter.post("/", (req, res) => {
    const { group, points } = req.body;
    if (!group || points === undefined) {
        return res.status(400).json({ message: "Название группы и баллы обязательны!" });
    }
    try {
        let ranking = JSON.parse(fs.readFileSync(rankingFile, "utf8"));
        const newTeam = { id: uuidv4(), group, points };
        ranking.push(newTeam);
        fs.writeFileSync(rankingFile, JSON.stringify(ranking, null, 2));

        res.status(201).json({ message: "Команда добавлена", team: newTeam });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при добавлении команды" });
    }
});

// Изменение баллов команды
rankingRouter.put("/:id", (req, res) => {
    const { id } = req.params;
    const { points } = req.body;
    try {
        let ranking = JSON.parse(fs.readFileSync(rankingFile, "utf8"));
        const teamIndex = ranking.findIndex(team => team.id === id);
        if (teamIndex === -1) {
            return res.status(404).json({ message: "Команда не найдена" });
        }
        ranking[teamIndex].points = points;
        fs.writeFileSync(rankingFile, JSON.stringify(ranking, null, 2));
        res.status(200).json({ message: "Баллы обновлены", team: ranking[teamIndex] });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при обновлении баллов" });
    }
});

// Удаление команды
rankingRouter.delete("/:id", (req, res) => {
    const { id } = req.params;
    try {
        let ranking = JSON.parse(fs.readFileSync(rankingFile, "utf8"));
        ranking = ranking.filter(team => team.id !== id);
        fs.writeFileSync(rankingFile, JSON.stringify(ranking, null, 2));
        res.status(200).json({ message: "Команда удалена" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при удалении команды" });
    }
});

const groupsFile = path.join(__dirname, "groups.json");

// Эндпоинт для получения списка доступных групп
rankingRouter.get("/groups", (req, res) => {
    try {
        const groups = JSON.parse(fs.readFileSync(groupsFile, "utf-8"));
        res.json(groups);
    } catch (error) {
        console.error("Ошибка загрузки списка групп:", error);
        res.status(500).json({ message: "Ошибка сервера при загрузке групп" });
    }
});

module.exports = rankingRouter;
