const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { logger } = require("./logger");

const registrationRouter = require("./registration");
const adminRouter = require("./adminTools");
const newsRouter = require("./news");
const announcementsRouter = require("./announcements");
const materialsRouter = require("./materials");
const rankingRouter = require("./ranking");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(`Запрос: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    next();
});

app.use("/registration", registrationRouter);
app.use("/admin-tools", adminRouter);
app.use("/news", newsRouter);
app.use("/announcements", announcementsRouter);
app.use("/materials", materialsRouter);
app.use("/ranking", rankingRouter);

app.use((err, req, res, next) => {
    logger.error(`Ошибка: ${err.message} | Stack: ${err.stack}`);
    res.status(err.status || 500).json({
        message: err.message || "Внутренняя ошибка сервера",
    });
});

app.use((req, res) => {
    logger.warn(`Маршрут не найден: ${req.originalUrl}`);
    res.status(404).json({ message: "Маршрут не найден" });
});

app.listen(PORT, () => {
    logger.info(`Сервер запущен на порте:${PORT}`);
    console.log(`Сервер запущен на порте:${PORT}`);
});
