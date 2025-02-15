const express = require("express");
const multer = require("multer");
const announcementsRouter = express.Router();
const fs = require("fs");
const path = require("path");
const { authenticateToken, authorizeRole } = require("./middleware");
const markdownFolder = path.join(__dirname, "markdown-files-announcements");
const uploadFolder = path.join(__dirname, "uploads-announcements")
announcementsRouter.use("/uploads-announcements", express.static(uploadFolder));
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
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
        cb(null, `${Date.now()}_${originalName}`);
    },
});

const upload = multer({ storage });

announcementsRouter.post(
    "/create_announcements",
    authenticateToken,
    authorizeRole(["teacher", "admin"]),
    upload.fields([{ name: "image", maxCount: 1 }, { name: "files", maxCount: 5 }]),
    (req, res) => {
        console.log("Полученные данные:", req.body);
        const { title, content, audience, groups } = req.body;
        const indexPath = path.join(markdownFolder, "announcements-index.json");
        const usersFile = path.join(__dirname, "users.json");
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === req.user.id);
        if (!user) {
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        if (!title || !content || !audience || !Array.isArray(JSON.parse(audience))) {
            return res.status(400).send("Заголовок, содержание и аудитория обязательны");
        }
        const id = Date.now();
        const filePath = path.join(markdownFolder, `${id}.md`);
        const image = req.files["image"] ? `/uploads-announcements/${req.files["image"][0].filename}` : null;
        const files = req.files["files"] ? req.files["files"].map(file => `/uploads-announcements/${file.filename}`) : [];
        const newAnnouncements = {
            id,
            title,
            content,
            audience: JSON.parse(audience),
            group: JSON.parse(groups || "[]"),
            image,
            files,
        };
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                return res.status(500).send("Ошибка при сохранении новости");
            }
            let announcementsIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf-8")) : [];
            announcementsIndex.push(newAnnouncements);
            fs.writeFile(indexPath, JSON.stringify(announcementsIndex, null, 2), (err) => {
                if (err) {
                    return res.status(500).send("Ошибка при обновлении индекса");
                }
                res.send({ message: "Новость успешно создана", id, image, files });
            });
        });
    }
);

announcementsRouter.get("/groups", authenticateToken, (req, res) => {
    const groupsFile = path.join(__dirname, "groups.json");
    try {
        const groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при загрузке групп" });
    }
});

announcementsRouter.get("/:id/groups", authenticateToken, (req, res) => {
    const { id } = req.params;
    if (!fs.existsSync(markdownFolder)) {
        return res.status(404).json({ message: "Файл новостей не найден" });
    }
    try {
        const indexPath = path.join(markdownFolder, "announcements-index.json");
        const announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        const announcement = announcementsIndex.find((ann) => String(ann.id) === id);
        if (!announcement) {
            return res.status(404).json({ message: "Новость не найдена" });
        }
        const group = Array.isArray(announcement.group) ? announcement.group : [];
        res.status(200).json({ group });
    } catch (error) {
        console.error("Ошибка при получении групп новости:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

announcementsRouter.get("/read", authenticateToken, (req, res) => {
    const { id } = req.user;
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    const usersFile = path.join(__dirname, "users.json");
    if (!fs.existsSync(indexPath) || !fs.existsSync(usersFile)) {
        return res.status(404).json({ message: "Файлы данных не найдены" });
    }
    try {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === id);
        if (!user) {
            console.log("Пользователь не найден в users.json:", id);
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        const userRole = user.role;
        const userGroups = Array.isArray(user.group) ? user.group : [user.group];
        let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        if (userRole === "admin") {
            return res.json(announcementsIndex.map((announcement) => ({ ...announcement, canEdit: true })));
        }
        const filteredAnnouncements = announcementsIndex
            .filter((announcement) => {
                const matchesRole =
                    (userRole === "guest" && announcement.audience.includes("guest")) ||
                    (userRole !== "guest" && announcement.audience.includes(userRole));
                const matchesGroup = Array.isArray(announcement.group) && announcement.group.some((group) => userGroups.includes(group));
                return matchesRole && matchesGroup;
            })
            .map((announcement) => ({
                ...announcement,
                canEdit: userRole === "teacher",
            }));
        res.json(filteredAnnouncements);
    } catch (error) {
        console.error("Ошибка при чтении объявлений:", error);
        res.status(500).json({ message: "Ошибка сервера при обработке объявлений" });
    }
});

announcementsRouter.use("/files", express.static(uploadFolder));

announcementsRouter.get("/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    const usersFile = path.join(__dirname, "users.json");
    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Объявление не найдено" });
        }
        const content = fs.readFileSync(filePath, "utf-8");
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === userId);
        let announcementsIndex = [];
        if (fs.existsSync(indexPath)) {
            try {
                announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
            } catch (err) {
                console.error("Ошибка парсинга индекса:", err);
                return res.status(500).json({ message: "Ошибка чтения индекса новостей" });
            }
        }
        const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === id);
        if (!announcementsItem) {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
        const canEdit = user.role === "teacher" || user.role === "admin";
        const imageUrl = announcementsItem.image ? `${baseBackendUrl}/announcements/test-image/${path.basename(announcementsItem.image)}` : null;
        const filesUrl = announcementsItem.files ? announcementsItem.files.map(file => ({
            url: `${baseBackendUrl}/announcements/files/${path.basename(file)}`,
            name: file.split("_").slice(1).join("_")
        })) : [];
        let responseData = {
            id: announcementsItem.id,
            title: announcementsItem.title,
            content,
            image: imageUrl,
            files: filesUrl,
            audience: announcementsItem.audience,
            canEdit,
        };
        res.status(200).json(responseData);
    } catch (err) {
        console.error("Ошибка обработки запроса:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

announcementsRouter.get("/download/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadFolder, filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error("Ошибка при скачивании файла:", err);
                res.status(500).json({ message: "Ошибка при скачивании файла" });
            }
        });
    } else {
        res.status(404).json({ message: "Файл не найден" });
    }
});

announcementsRouter.put("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const { title, content, audience, groups } = req.body;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Новость не найдена" });
    }
    if (!title || !content) {
        return res.status(400).json({ message: "Заголовок и содержание обязательны" });
    }
    try {
        fs.writeFileSync(filePath, content, "utf-8");
        let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        const index = announcementsIndex.findIndex((announcements) => String(announcements.id) === id);
        if (index !== -1) {
            announcementsIndex[index].title = title;
            announcementsIndex[index].audience = audience;
            announcementsIndex[index].group = groups;
            fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2), "utf-8");
            return res.status(200).json({ message: "Новость успешно обновлена" });
        } else {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
    } catch (error) {
        console.error("Ошибка при обновлении новости:", error);
        return res.status(500).json({ message: "Ошибка при обновлении новости" });
    }
});

announcementsRouter.delete("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Ошибка при удалении файла новости:", err);
                return res.status(500).send("Не удалось удалить новость");
            }
            try {
                let announcementsIndex = [];
                if (fs.existsSync(indexPath)) {
                    announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
                }
                const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === String(id));
                if (!announcementsItem) {
                    return res.status(404).send("Новость не найдена в индексе");
                }
                if (announcementsItem.image) {
                    const imagePath = path.join(__dirname, announcementsItem.image.replace("/uploads-announcements/", "uploads-announcements/"));
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
                if (announcementsItem.files && Array.isArray(announcementsItem.files)) {
                    announcementsItem.files.forEach(file => {
                        const filePath = path.join(__dirname, file.replace("/uploads-announcements/", "uploads-announcements/"));
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    });
                }
                announcementsIndex = announcementsIndex.filter((announcements) => String(announcements.id) !== String(id));
                fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2));
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

announcementsRouter.get("/test-image/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = filename;
    if (fs.existsSync(path.join(uploadFolder, filePath))) {
        res.sendFile(filePath, { root: uploadFolder });
    } else {
        res.status(404).json({ message: "Изображение не найдено" });
    }
});

announcementsRouter.post("/:id/upload_image", authenticateToken, authorizeRole(["teacher", "admin"]), upload.single("image"), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    if (!req.file) {
        return res.status(400).send("Изображение не загружено");
    }
    const imageUrl = `/uploads-announcements/${req.file.filename}`;
    let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === id);
    if (!announcementsItem) {
        return res.status(404).send("Новость не найдена");
    }
    announcementsItem.image = imageUrl;
    fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2));
    res.status(200).json({ message: "Изображение успешно загружено", imageUrl });
});

announcementsRouter.delete("/:id/delete_image", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === id);
    if (!announcementsItem || !announcementsItem.image) {
        return res.status(404).send("Изображение не найдено");
    }
    const imagePath = path.join(__dirname, announcementsItem.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
    announcementsItem.image = null;
    fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2));
    res.status(200).send("Изображение успешно удалено");
});

announcementsRouter.delete("/:id/:filename", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id, filename } = req.params;
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    console.log(`Запрос на удаление файла: ${filename} из новости: ${id}`);
    if (!fs.existsSync(indexPath)) {
        console.error("Файл индекса новостей не найден!");
        return res.status(404).json({ message: "Индекс новостей не найден" });
    }
    let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === id);
    if (!announcementsItem || !announcementsItem.files) {
        console.error("Новость или файлы не найдены в индексе!");
        return res.status(404).json({ message: "Новость или файлы не найдены" });
    }
    console.log("Список файлов в новости:", announcementsItem.files);
    const fileToDelete = announcementsItem.files.find((file) => {
        const fileBaseName = path.basename(file);
        return fileBaseName.includes(`_${filename}`);
    });
    if (!fileToDelete) {
        console.error(`Файл ${filename} не найден в списке файлов новости!`);
        return res.status(404).json({ message: "Файл не найден" });
    }
    const filePath = path.join(uploadFolder, path.basename(fileToDelete));
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Файл ${filename} успешно удален с сервера`);
    } else {
        console.warn(`Файл ${filePath} отсутствует на сервере`);
    }
    announcementsItem.files = announcementsItem.files.filter((file) => file !== fileToDelete);
    fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2));
    console.log(`Файл ${filename} успешно удален из JSON индекса`);
    res.status(200).json({ message: "Файл успешно удален" });
});

announcementsRouter.post("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), upload.array("files", 5), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    if (!fs.existsSync(indexPath)) {
        return res.status(404).json({ message: "Индекс новостей не найден" });
    }
    let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const announcementsItem = announcementsIndex.find(announcements => String(announcements.id) === id);
    if (!announcementsItem) {
        return res.status(404).json({ message: "Новость не найдена" });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Файлы не загружены" });
    }
    const newFiles = req.files.map(file => `/uploads-announcements/${file.filename}`);
    announcementsItem.files = [...(announcementsItem.files || []), ...newFiles];
    fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2), "utf-8");
    res.status(200).json({ message: "Файлы успешно добавлены", files: newFiles });
});


module.exports = announcementsRouter;
