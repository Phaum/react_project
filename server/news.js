const express = require("express");
const multer = require("multer");
const newsRouter = express.Router();
const fs = require("fs");
const path = require("path");
const { authenticateToken, authorizeRole } = require("./middleware");
const markdownFolder = path.join(__dirname, "markdown-files-news");
const uploadFolder = path.join(__dirname, "uploads-news");
newsRouter.use("/uploads-news", express.static(uploadFolder));
const {baseBackendUrl } = require("./shared/constants");

if (!fs.existsSync(markdownFolder)) {
    fs.mkdirSync(markdownFolder);
}

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8"); // Декодируем кириллицу
        cb(null, `${Date.now()}_${originalName}`);
    },
});

const upload = multer({ storage });

newsRouter.post(
    "/create_news",
    authenticateToken,
    authorizeRole(["teacher", "admin"]),
    upload.fields([{ name: "image", maxCount: 1 }, { name: "files", maxCount: 5 }]), // 1 фото + до 5 файлов
    (req, res) => {
        const { title, content, audience } = req.body;
        if (!title || !content || !audience || !Array.isArray(JSON.parse(audience))) {
            return res.status(400).send("Заголовок, содержание и аудитория обязательны");
        }
        const id = Date.now();
        const filePath = path.join(markdownFolder, `${id}.md`);
        const indexPath = path.join(markdownFolder, "news-index.json");
        // Получаем ссылки на загруженные файлы
        const image = req.files["image"] ? `/uploads-news/${req.files["image"][0].filename}` : null;
        const files = req.files["files"] ? req.files["files"].map(file => `/uploads-news/${file.filename}`) : [];
        // Сохраняем контент новости
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                return res.status(500).send("Ошибка при сохранении новости");
            }
            let newsIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf-8")) : [];
            newsIndex.push({ id, title, audience: JSON.parse(audience), image, files });
            fs.writeFile(indexPath, JSON.stringify(newsIndex, null, 2), (err) => {
                if (err) {
                    return res.status(500).send("Ошибка при обновлении индекса");
                }
                res.send({ message: "Новость успешно создана", id, image, files });
            });
        });
    }
);

newsRouter.get("/read", authenticateToken, (req, res) => {
    const { id } = req.user;
    const indexPath = path.join(markdownFolder, "news-index.json");
    const usersFile = path.join(__dirname, "users.json");
    if (fs.existsSync(indexPath)) {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === id);
        if (!user) {
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        const userRole = user.role;
        let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        if (userRole === "admin") {
            return res.json(newsIndex.map((news) => ({ ...news, canEdit: true })));
        }
        const filteredNews = newsIndex.map((news) => ({
            ...news,
            canEdit: userRole === "teacher" || userRole === "admin", // Разрешение редактирования
        })).filter((news) => (userRole === "guest" && news.audience.includes("guest")) || // Гость видит только гостевые объявления
            (userRole !== "guest" && news.audience.includes(userRole)));
        res.json(filteredNews);
    } else {
        res.status(404).json({ message: "Список новостей пуст" });
    }
});

newsRouter.use("/files", express.static(uploadFolder));

newsRouter.get("/:id", authenticateToken,(req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "news-index.json");
    const usersFile = path.join(__dirname, "users.json");
    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Новость не найдена" });
        }
        const content = fs.readFileSync(filePath, "utf-8");
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === userId);
        let newsIndex = [];
        if (fs.existsSync(indexPath)) {
            try {
                newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
            } catch (err) {
                console.error("Ошибка парсинга индекса:", err);
                return res.status(500).json({ message: "Ошибка чтения индекса новостей" });
            }
        }
        const newsItem = newsIndex.find((news) => String(news.id) === id);
        if (!newsItem) {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
        const canEdit = user.role === "teacher" || user.role === "admin";
        const imageUrl = newsItem.image ? `${baseBackendUrl}/news/test-image/${path.basename(newsItem.image)}` : null;
        const filesUrl = newsItem.files ? newsItem.files.map(file => ({
            url: `${baseBackendUrl}/news/files/${path.basename(file)}`,
            name: file.split("_").slice(1).join("_")
        })) : [];
        let responseData = {
            id: newsItem.id,
            title: newsItem.title,
            content,
            image: imageUrl,
            files: filesUrl,
            audience: newsItem.audience,
            canEdit,
        };
        res.status(200).json(responseData);
    } catch (err) {
        console.error("Ошибка обработки запроса:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

newsRouter.put("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const { title, content, audience } = req.body;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "news-index.json");
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Новость не найдена" });
    }
    if (!title || !content) {
        return res.status(400).json({ message: "Заголовок и содержание обязательны" });
    }
    try {
        fs.writeFileSync(filePath, content, "utf-8");
        let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        const index = newsIndex.findIndex((news) => String(news.id) === id);
        if (index !== -1) {
            newsIndex[index].title = title;
            newsIndex[index].audience = audience;
            fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2), "utf-8");
            return res.status(200).json({ message: "Новость успешно обновлена" });
        } else {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
    } catch (error) {
        console.error("Ошибка при обновлении новости:", error);
        return res.status(500).json({ message: "Ошибка при обновлении новости" });
    }
});

newsRouter.delete("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "news-index.json");
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Ошибка при удалении файла новости:", err);
                return res.status(500).send("Не удалось удалить новость");
            }
            try {
                let newsIndex = [];
                if (fs.existsSync(indexPath)) {
                    newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
                }
                const newsItem = newsIndex.find((news) => String(news.id) === String(id));
                if (!newsItem) {
                    return res.status(404).send("Новость не найдена в индексе");
                }
                if (newsItem.image) {
                    const imagePath = path.join(__dirname, newsItem.image.replace("/uploads-news/", "uploads-news/"));
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
                if (newsItem.files && Array.isArray(newsItem.files)) {
                    newsItem.files.forEach(file => {
                        const filePath = path.join(__dirname, file.replace("/uploads-news/", "uploads-news/"));
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    });
                }
                newsIndex = newsIndex.filter((news) => String(news.id) !== String(id));
                fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2));
                res.send({ message: "Новость и связанное изображение успешно удалены" });
            } catch (error) {
                console.error("Ошибка при обновлении индекса:", error);
                res.status(500).send("Ошибка при обновлении индекса");
            }
        });
    } else {
        res.status(404).send("Новость не найдена");
    }
});


newsRouter.get("/test-image/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = filename;
    if (fs.existsSync(path.join(uploadFolder, filePath))) {
        res.sendFile(filePath, { root: uploadFolder }); // Указываем root как uploadFolder
    } else {
        res.status(404).json({ message: "Изображение не найдено" });
    }
});

newsRouter.post("/:id/upload_image", authenticateToken, authorizeRole(["teacher", "admin"]), upload.single("image"), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "news-index.json");
    if (!req.file) {
        return res.status(400).send("Изображение не загружено");
    }
    const imageUrl = `/uploads-news/${req.file.filename}`;
    let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const newsItem = newsIndex.find((news) => String(news.id) === id);
    if (!newsItem) {
        return res.status(404).send("Новость не найдена");
    }
    newsItem.image = imageUrl;
    fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2));
    res.status(200).json({ message: "Изображение успешно загружено", imageUrl });
});

newsRouter.delete("/:id/delete_image", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "news-index.json");
    let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const newsItem = newsIndex.find((news) => String(news.id) === id);
    if (!newsItem || !newsItem.image) {
        return res.status(404).send("Изображение не найдено");
    }
    const imagePath = path.join(__dirname, newsItem.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
    newsItem.image = null;
    fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2));
    res.status(200).send("Изображение успешно удалено");
});

newsRouter.delete("/:id/:filename", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id, filename } = req.params;
    const indexPath = path.join(markdownFolder, "news-index.json");
    console.log(`Запрос на удаление файла: ${filename} из новости: ${id}`);
    if (!fs.existsSync(indexPath)) {
        console.error("Файл индекса новостей не найден!");
        return res.status(404).json({ message: "Индекс новостей не найден" });
    }
    let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const newsItem = newsIndex.find((news) => String(news.id) === id);
    if (!newsItem || !newsItem.files) {
        console.error("Новость или файлы не найдены в индексе!");
        return res.status(404).json({ message: "Новость или файлы не найдены" });
    }
    console.log("Список файлов в новости:", newsItem.files);
    const fileToDelete = newsItem.files.find((file) => {
        const fileBaseName = path.basename(file);
        return fileBaseName.includes(`_${filename}`);
    });
    if (!fileToDelete) {
        console.error(`Файл ${filename} не найден в списке файлов новости!`);
        return res.status(404).json({ message: "Файл не найден" });
    }
    const filePath = path.join(uploadFolder, path.basename(fileToDelete));
    // Удаляем файл с сервера
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Файл ${filename} успешно удален с сервера`);
    } else {
        console.warn(`Файл ${filePath} отсутствует на сервере`);
    }
    // Удаляем файл из массива `files`
    newsItem.files = newsItem.files.filter((file) => file !== fileToDelete);
    // Обновляем `news-index.json`
    fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2));
    console.log(`Файл ${filename} успешно удален из JSON индекса`);
    res.status(200).json({ message: "Файл успешно удален" });
});

newsRouter.post("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), upload.array("files", 5), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "news-index.json");
    if (!fs.existsSync(indexPath)) {
        return res.status(404).json({ message: "Индекс новостей не найден" });
    }
    let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const newsItem = newsIndex.find(news => String(news.id) === id);
    if (!newsItem) {
        return res.status(404).json({ message: "Новость не найдена" });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Файлы не загружены" });
    }
    const newFiles = req.files.map(file => `/uploads-news/${file.filename}`);
    newsItem.files = [...(newsItem.files || []), ...newFiles];
    fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2), "utf-8");
    res.status(200).json({ message: "Файлы успешно добавлены", files: newFiles });
});


module.exports = newsRouter;
