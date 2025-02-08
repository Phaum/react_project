const express = require("express");
const multer = require("multer");
const newsRouter = express.Router();
const fs = require("fs");
const path = require("path");
const { authenticateToken, authorizeRole } = require("./middleware");
const markdownFolder = "./markdown-files-news";
const uploadFolder = "./uploads-news";
newsRouter.use("/uploads-news", express.static(path.join(__dirname, "uploads-news")));

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



// Эндпоинт для создания новости
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

// Эндпоинт для чтения новостей на основе роли
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
        const userRole = user.role; // Получаем актуальную роль
        // Загружаем новости
        let newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        // Если роль admin, показываем все новости
        if (userRole === "admin") {
            // return res.send(newsIndex);
            return res.json(newsIndex.map((news) => ({ ...news, canEdit: true })));
        }
        // // Фильтруем новости по ролям и группам
        // let filteredNews = newsIndex.filter(
        //     (news) =>
        //         news.audience.includes(userRole) ||
        //         news.audience.includes("guest")
        // );
        // if (filteredNews.length === 0) {
        //     return res.json([]); // Всегда возвращаем пустой массив
        // }
        // res.send(filteredNews);
        // Фильтрация новостей по ролям + добавление `canEdit`
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
// newsRouter.get("/:id", authenticateToken, (req, res) => {
//     const { id } = req.params; // ID новости
//     const userId = req.user.id; // ID пользователя из токена
//     const filePath = path.join(markdownFolder, `${id}.md`);
//     const indexPath = path.join(markdownFolder, "news-index.json");
//     const usersFile = path.join(__dirname, "users.json");
//     try {
//         // Проверяем существование файла новости
//         if (!fs.existsSync(filePath)) {
//             return res.status(404).json({ message: "Новость не найдена" });
//         }
//         // Читаем пользователей
//         const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
//         const user = users.find((u) => u.id === userId);
//         if (!user) {
//             return res.status(403).json({ message: "Пользователь не найден" });
//         }
//         const userRole = user.role; // Определяем роль пользователя
//         // Читаем содержимое файла новости
//         const content = fs.readFileSync(filePath, "utf-8");
//         // Проверяем существование индекса новостей
//         if (!fs.existsSync(indexPath)) {
//             return res.status(500).json({ message: "Ошибка чтения индекса новостей" });
//         }
//         // Загружаем индекс новостей
//         const newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
//         // Ищем новость в индексе
//         const newsItem = newsIndex.find((news) => String(news.id) === id);
//         if (!newsItem) {
//             return res.status(404).json({ message: "Новость не найдена в индексе" });
//         }
//         // Проверяем, доступна ли новость пользователю
//         if (!newsItem.audience.includes(userRole) && !newsItem.audience.includes("guest")) {
//             return res.status(403).json({ message: "У вас нет доступа к этой новости" });
//         }
//         // Добавляем ссылку на изображение, если есть
//         const imageUrl = newsItem.image ? `http://localhost:5000/news/test-image/${path.basename(newsItem.image)}` : null;
//         // Добавляем ссылки на файлы, если есть
//         const filesUrl = newsItem.files ? newsItem.files.map(file => ({
//             url: `http://localhost:5000/news/files/${path.basename(file)}`,
//             name: file.split("_").slice(1).join("_")
//         })) : [];
//         // Формируем ответ
//         let responseData = {
//             id: newsItem.id,
//             title: newsItem.title,
//             content,
//             image: imageUrl,
//             files: filesUrl,
//         };
//         // Если у пользователя роль admin или teacher — добавляем audience
//         if (userRole === "admin" || userRole === "teacher") {
//             responseData.audience = newsItem.audience || [];
//         }
//         res.status(200).json(responseData);
//     } catch (err) {
//         console.error("Ошибка обработки запроса:", err);
//         res.status(500).json({ message: "Внутренняя ошибка сервера" });
//     }
// });

// Раздача статических файлов (если еще не добавлено)
newsRouter.use("/files", express.static(uploadFolder));

// Эндпоинт для чтения конкретной новости по id
// newsRouter.get("/:id", authenticateToken,(req, res) => {
//     const { id } = req.params; // Получаем ID из параметров маршрута
//     const userRole = req.role;
//     const filePath = path.join(markdownFolder, `${id}.md`); // Путь к файлу новости
//     const indexPath = path.join(markdownFolder, "news-index.json"); // Путь к индексу новостей
//     try {
//         // Проверяем существование файла новости
//         if (!fs.existsSync(filePath)) {
//             return res.status(404).json({ message: "Новость не найдена" });
//         }
//         // Читаем содержимое файла новости
//         const content = fs.readFileSync(filePath, "utf-8");
//         // Проверяем существование файла индекса
//         let newsIndex = [];
//         if (fs.existsSync(indexPath)) {
//             try {
//                 newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
//             } catch (err) {
//                 console.error("Ошибка парсинга индекса:", err);
//                 return res.status(500).json({ message: "Ошибка чтения индекса новостей" });
//             }
//         }
//         // Ищем новость в индексе
//         const newsItem = newsIndex.find((news) => String(news.id) === id);
//         if (!newsItem) {
//             return res.status(404).json({ message: "Новость не найдена в индексе" });
//         }
//         // Добавляем ссылку на изображение, если есть
//         const imageUrl = newsItem.image ? `http://localhost:5000/news/test-image/${path.basename(newsItem.image)}` : null;
//         // Добавляем ссылки на файлы, если они есть
//         const filesUrl = newsItem.files ? newsItem.files.map(file => ({
//             url: `http://localhost:5000/news/files/${path.basename(file)}`,
//             name: file.split("_").slice(1).join("_")
//         })) : [];
//         let responseData = {
//             id: newsItem.id,
//             title: newsItem.title,
//             content,
//             image: imageUrl, // Ссылка на изображение
//             files: filesUrl, // Массив файлов с именами и ссылками
//         };
//         // Если пользователь НЕ user и НЕ student, добавляем поле audience
//         if (userRole !== "user" && userRole !== "student") {
//             responseData.audience = newsItem.audience || [];
//         }
//         res.status(200).json(responseData);
//     } catch (err) {
//         console.error("Ошибка обработки запроса:", err);
//         res.status(500).json({ message: "Внутренняя ошибка сервера" });
//     }
// });

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
        // Ищем новость в индексе
        const newsItem = newsIndex.find((news) => String(news.id) === id);
        if (!newsItem) {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
        // Определяем, может ли пользователь редактировать/удалять
        const canEdit = user.role === "teacher" || user.role === "admin";
        // Добавляем ссылку на изображение, если есть
        const imageUrl = newsItem.image ? `http://localhost:5000/news/test-image/${path.basename(newsItem.image)}` : null;
        // Добавляем ссылки на файлы, если они есть
        const filesUrl = newsItem.files ? newsItem.files.map(file => ({
            url: `http://localhost:5000/news/files/${path.basename(file)}`,
            name: file.split("_").slice(1).join("_")
        })) : [];
        let responseData = {
            id: newsItem.id,
            title: newsItem.title,
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

// Эндпоинт для редактирования новости
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
        // Обновляем файл с новостью
        fs.writeFileSync(filePath, content, "utf-8");
        // Обновляем заголовок в индексе
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

// Эндпоинт для удаления новости
newsRouter.delete("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params; // ID из параметров маршрута
    const filePath = path.join(markdownFolder, `${id}.md`); // Путь к файлу новости
    const indexPath = path.join(markdownFolder, "news-index.json"); // Путь к файлу индекса
    // Проверяем, существует ли файл новости
    if (fs.existsSync(filePath)) {
        // Удаляем файл с новостью
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Ошибка при удалении файла новости:", err);
                return res.status(500).send("Не удалось удалить новость");
            }
            try {
                // Обновляем news-index.json
                let newsIndex = [];
                if (fs.existsSync(indexPath)) {
                    newsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
                }
                // Находим новость в индексе
                const newsItem = newsIndex.find((news) => String(news.id) === String(id));
                if (!newsItem) {
                    return res.status(404).send("Новость не найдена в индексе");
                }
                // Удаляем связанный файл изображения, если он есть
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
                // Фильтруем индекс, удаляя запись с указанным ID
                newsIndex = newsIndex.filter((news) => String(news.id) !== String(id));
                // Записываем обновлённый индекс обратно в файл
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

// Эндпоинт для удаления определенного фото
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
    console.log("📂 Список файлов в новости:", newsItem.files);
    // ✅ Найдём файл, игнорируя временной штамп
    const fileToDelete = newsItem.files.find((file) => {
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

// Добавление новых файлов в новость
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
    // Записываем файлы как строки, а не объекты
    const newFiles = req.files.map(file => `/uploads-news/${file.filename}`);
    // Обновляем список файлов
    newsItem.files = [...(newsItem.files || []), ...newFiles];
    // Перезаписываем news-index.json
    fs.writeFileSync(indexPath, JSON.stringify(newsIndex, null, 2), "utf-8");
    res.status(200).json({ message: "Файлы успешно добавлены", files: newFiles });
});


module.exports = newsRouter;
