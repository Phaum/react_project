const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const registrationRouter = require("./registration");
const adminRouter = require("./adminTools");
const newsRouter = require("./news");
const announcementsRouter = require("./announcements");
const materialsRouter = require("./materials");

const app = express();
const PORT = process.env.PORT || 5000; // Позволяет использовать переменные окружения для порта

// Middleware
app.use(cors()); // Включаем CORS для всех маршрутов
app.use(bodyParser.json()); // Обрабатываем JSON-запросы

// Роутеры
app.use("/registration", registrationRouter); // Роутер для авторизации
app.use("/admin-tools", adminRouter); // Роутер для панели администратора
app.use("/news", newsRouter); // Роутер для новостей
app.use("/announcements", announcementsRouter); // Роутер для обьявлений
app.use("/materials", materialsRouter); // Роутер для материалов

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error("Ошибка:", err.stack);
    res.status(err.status || 500).json({
        message: err.message || "Внутренняя ошибка сервера",
    });
});

// 404 - Маршрут не найден
app.use((req, res) => {
    res.status(404).json({ message: "Маршрут не найден" });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
