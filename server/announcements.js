const express = require("express");
const multer = require("multer");
const announcementsRouter = express.Router();
const fs = require("fs");
const path = require("path");
const { authenticateToken, authorizeRole } = require("./middleware");
const markdownFolder = path.join(__dirname, "markdown-files-announcements");
const uploadFolder = path.join(__dirname, "uploads-announcements")
announcementsRouter.use("/uploads-announcements", express.static(uploadFolder));

if (!fs.existsSync(markdownFolder)) {
    fs.mkdirSync(markdownFolder);
}

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// Настройка multer для загрузки файлов
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

// Эндпоинт для создания объявления
announcementsRouter.post(
    "/create_announcements",
    authenticateToken,
    authorizeRole(["teacher", "admin"]),
    upload.fields([{ name: "image", maxCount: 1 }, { name: "files", maxCount: 5 }]), // 1 фото + до 5 файлов
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
        // Получаем ссылки на загруженные файлы
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
        // Сохраняем контент новости в `.md`
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

// Получение списка всех групп
announcementsRouter.get("/groups", authenticateToken, (req, res) => {
    const groupsFile = path.join(__dirname, "groups.json");
    try {
        const groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при загрузке групп" });
    }
});

// Получение списка групп конкретной новости
announcementsRouter.get("/:id/groups", authenticateToken, (req, res) => {
    const { id } = req.params;
    // Проверяем, существует ли файл с индексом объявлений
    if (!fs.existsSync(markdownFolder)) {
        return res.status(404).json({ message: "Файл новостей не найден" });
    }
    try {
        // Загружаем все объявления
        const indexPath = path.join(markdownFolder, "announcements-index.json");
        const announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        // Ищем нужную новость по `id`
        const announcement = announcementsIndex.find((ann) => String(ann.id) === id);
        if (!announcement) {
            return res.status(404).json({ message: "Новость не найдена" });
        }
        // Получаем группы новости (или пустой массив, если они не заданы)
        const group = Array.isArray(announcement.group) ? announcement.group : [];
        // console.log(group);
        res.status(200).json({ group });
    } catch (error) {
        console.error("Ошибка при получении групп новости:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// Эндпоинт для чтения новостей на основе роли и группы
// announcementsRouter.get("/read", authenticateToken, (req, res) => {
//     const { id } = req.user;
//     const indexPath = path.join(markdownFolder, "announcements-index.json");
//     const usersFile = path.join(__dirname, "users.json");
//     if (fs.existsSync(indexPath)) {
//         const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
//         const user = users.find((u) => u.id === id);
//         if (!user) {
//             return res.status(403).json({ message: "Пользователь не найден" });
//         }
//         const userRole = user.role; // Получаем актуальную роль
//         const userGroup = user.group; // Получаем актуальную группу
//         // Загружаем объявления
//         let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
//         // Если роль admin, показываем все новости
//         if (userRole === "admin") {
//             // return res.send(announcementsIndex);
//             return res.json(announcementsIndex.map((announcements) => ({ ...announcements, canEdit: true })));
//         }
//         // Фильтруем новости по ролям
//         // let filteredAnnouncements = announcementsIndex.filter(
//         //     (announcement) =>
//         //         announcement.audience.includes(userRole) ||
//         //         announcement.audience.includes("guest")
//         // );
//         // const filteredAnnouncements = announcementsIndex.map((announcement) => ({
//         //     ...announcement,
//         //     canEdit: userRole === "teacher" || userRole === "admin", // Разрешение редактирования
//         // })).filter((announcement) => announcement.audience.includes(userRole) || announcement.audience.includes("guest"));
//         // // Оставляем только новости, где `groups` пересекается с `userGroups`
//         const userGroups = Array.isArray(userGroup) ? userGroup : [userGroup]; // Превращаем в массив
//         // if (filteredAnnouncements.length === 0) {
//         //     return res.json([]); // Всегда возвращаем пустой массив
//         // }
//         // res.send(filteredAnnouncements);
//         const filteredAnnouncements = announcementsIndex
//             .map((announcement) => ({
//                 ...announcement,
//                 canEdit: userRole === "teacher" || userRole === "admin", // Разрешение редактирования
//             }))
//             .filter((announcement) =>
//                 (announcement.audience.includes(userRole) || announcement.audience.includes("guest")) &&
//                 Array.isArray(announcement.groups) && announcement.groups.some(group => userGroups.includes(group)) // Фильтр по группам
//             );
//         // Если нет подходящих объявлений, возвращаем пустой массив
//         if (filteredAnnouncements.length === 0) {
//             return res.json([]);
//         }
//         res.send(filteredAnnouncements);
//     } else {
//         res.status(404).json({ message: "Список объявлений пуст" });
//     }
// });
// Эндпоинт для чтения новостей на основе роли и группы
announcementsRouter.get("/read", authenticateToken, (req, res) => {
    const { id } = req.user; // ID пользователя из токена
    const indexPath = path.join(markdownFolder, "announcements-index.json");
    const usersFile = path.join(__dirname, "users.json");
    if (!fs.existsSync(indexPath) || !fs.existsSync(usersFile)) {
        return res.status(404).json({ message: "Файлы данных не найдены" });
    }
    try {
        // Загружаем список пользователей и ищем текущего
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === id);
        if (!user) {
            console.log("Пользователь не найден в users.json:", id);
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        const userRole = user.role; // Получаем роль пользователя
        const userGroups = Array.isArray(user.group) ? user.group : [user.group]; // Преобразуем в массив
        // Загружаем объявления
        let announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        // Если роль admin, отправляем все объявления с правом редактирования
        if (userRole === "admin") {
            return res.json(announcementsIndex.map((announcement) => ({ ...announcement, canEdit: true })));
        }
        // Фильтрация объявлений по ролям и группам
        const filteredAnnouncements = announcementsIndex
            .filter((announcement) => {
                // const matchesRole = announcement.audience.includes(userRole) || announcement.audience.includes("guest");
                const matchesRole =
                    (userRole === "guest" && announcement.audience.includes("guest")) || // Гость видит только гостевые объявления
                    (userRole !== "guest" && announcement.audience.includes(userRole));  // Остальные роли видят только свое
                const matchesGroup = Array.isArray(announcement.group) && announcement.group.some((group) => userGroups.includes(group));
                return matchesRole && matchesGroup;
            })
            .map((announcement) => ({
                ...announcement,
                canEdit: userRole === "teacher", // Только учителя могут редактировать
            }));
        // Возвращаем результат
        res.json(filteredAnnouncements);
    } catch (error) {
        console.error("Ошибка при чтении объявлений:", error);
        res.status(500).json({ message: "Ошибка сервера при обработке объявлений" });
    }
});



// Раздача статических файлов (если еще не добавлено)
announcementsRouter.use("/files", express.static(uploadFolder));

// Эндпоинт для чтения конкретной новости по id
announcementsRouter.get("/:id", authenticateToken, (req, res) => {
    const { id } = req.params; // Получаем ID из параметров маршрута
    const userId = req.user.id;
    const filePath = path.join(markdownFolder, `${id}.md`); // Путь к файлу новости
    const indexPath = path.join(markdownFolder, "announcements-index.json"); // Путь к индексу новостей
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
        // Ищем новость в индексе
        const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === id);
        if (!announcementsItem) {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
        // Определяем, может ли пользователь редактировать/удалять
        const canEdit = user.role === "teacher" || user.role === "admin";
        // Добавляем ссылку на изображение, если есть
        const imageUrl = announcementsItem.image ? `http://localhost:5000/announcements/test-image/${path.basename(announcementsItem.image)}` : null;
        // Добавляем ссылки на файлы, если они есть
        const filesUrl = announcementsItem.files ? announcementsItem.files.map(file => ({
            url: `http://localhost:5000/announcements/files/${path.basename(file)}`,
            name: file.split("_").slice(1).join("_")
        })) : [];
        let responseData = {
            id: announcementsItem.id,
            title: announcementsItem.title,
            content,
            image: imageUrl, // Ссылка на изображение
            files: filesUrl, // Массив файлов с именами и ссылками
            canEdit,
        };
        res.status(200).json(responseData);
    } catch (err) {
        console.error("Ошибка обработки запроса:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// Эндпоинт для скачивания файла
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

// Эндпоинт для редактирования новости
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
        // Обновляем файл с новостью
        fs.writeFileSync(filePath, content, "utf-8");
        // Обновляем заголовок в индексе
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


// Эндпоинт для удаления новости
announcementsRouter.delete("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params; // ID из параметров маршрута
    const filePath = path.join(markdownFolder, `${id}.md`); // Путь к файлу новости
    const indexPath = path.join(markdownFolder, "announcements-index.json"); // Путь к файлу индекса
    // Проверяем, существует ли файл новости
    if (fs.existsSync(filePath)) {
        // Удаляем файл с новостью
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Ошибка при удалении файла новости:", err);
                return res.status(500).send("Не удалось удалить новость");
            }
            try {
                // Обновляем announcements-index.json
                let announcementsIndex = [];
                if (fs.existsSync(indexPath)) {
                    announcementsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
                }
                // Находим новость в индексе
                const announcementsItem = announcementsIndex.find((announcements) => String(announcements.id) === String(id));
                if (!announcementsItem) {
                    return res.status(404).send("Новость не найдена в индексе");
                }
                // Удаляем связанный файл изображения, если он есть
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
                // Фильтруем индекс, удаляя запись с указанным ID
                announcementsIndex = announcementsIndex.filter((announcements) => String(announcements.id) !== String(id));
                // Записываем обновлённый индекс обратно в файл
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
        res.sendFile(filePath, { root: uploadFolder }); // Указываем root как uploadFolder
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

// Эндпоинт для удаления определенного фото
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
    // Найдём файл, игнорируя временной штамп
    const fileToDelete = announcementsItem.files.find((file) => {
        const fileBaseName = path.basename(file);
        return fileBaseName.includes(`_${filename}`); // Ищем файл, который заканчивается на нужное имя
    });
    if (!fileToDelete) {
        console.error(`Файл ${filename} не найден в списке файлов новости!`);
        return res.status(404).json({ message: "Файл не найден" });
    }
    const filePath = path.join(uploadFolder, path.basename(fileToDelete));
    // Удаляем файл с сервера
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Файл ${filename} успешно удален с сервера`);
    } else {
        console.warn(`⚠️ Файл ${filePath} отсутствует на сервере`);
    }
    // Удаляем файл из массива `files`
    announcementsItem.files = announcementsItem.files.filter((file) => file !== fileToDelete);
    // Обновляем `announcements-index.json`
    fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2));
    console.log(`Файл ${filename} успешно удален из JSON индекса`);
    res.status(200).json({ message: "Файл успешно удален" });
});

// Добавление новых файлов в новость
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
    // Записываем файлы как строки, а не объекты
    const newFiles = req.files.map(file => `/uploads-announcements/${file.filename}`);
    // Обновляем список файлов
    announcementsItem.files = [...(announcementsItem.files || []), ...newFiles];
    // Перезаписываем announcements-index.json
    fs.writeFileSync(indexPath, JSON.stringify(announcementsIndex, null, 2), "utf-8");
    res.status(200).json({ message: "Файлы успешно добавлены", files: newFiles });
});


module.exports = announcementsRouter;
