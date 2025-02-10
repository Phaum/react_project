const express = require("express");
const multer = require("multer");
const materialsRouter = express.Router();
const fs = require("fs");
const path = require("path");
const { authenticateToken, authorizeRole } = require("./middleware");
const markdownFolder = path.join(__dirname, "markdown-files-materials");
const uploadFolder = path.join(__dirname, "uploads-materials")
materialsRouter.use("/uploads-materials", express.static(uploadFolder));
const {baseBackendUrl } = require("./shared/constants");

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
materialsRouter.post(
    "/create_materials",
    authenticateToken,
    authorizeRole(["teacher", "admin"]),
    upload.fields([{ name: "image", maxCount: 1 }, { name: "files", maxCount: 5 }]), // 1 фото + до 5 файлов
    (req, res) => {
        console.log("Полученные данные:", req.body);
        const { title, content, audience, groups } = req.body;
        const indexPath = path.join(markdownFolder, "materials-index.json");
        const usersFile = path.join(__dirname, "users.json");
        // Загружаем пользователя из `users.json`
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
        const image = req.files["image"] ? `/uploads-materials/${req.files["image"][0].filename}` : null;
        const files = req.files["files"] ? req.files["files"].map(file => `/uploads-materials/${file.filename}`) : [];
        const newMaterials = {
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
            let materialsIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf-8")) : [];
            materialsIndex.push(newMaterials);
            fs.writeFile(indexPath, JSON.stringify(materialsIndex, null, 2), (err) => {
                if (err) {
                    return res.status(500).send("Ошибка при обновлении индекса");
                }
                res.send({ message: "Новость успешно создана", id, image, files });
            });
        });
    }
);

// Получение списка всех групп
materialsRouter.get("/groups", authenticateToken, (req, res) => {
    const groupsFile = path.join(__dirname, "groups.json");
    try {
        const groups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при загрузке групп" });
    }
});

// Получение списка групп конкретной новости
materialsRouter.get("/:id/groups", authenticateToken, (req, res) => {
    const { id } = req.params;
    // Проверяем, существует ли файл с индексом объявлений
    if (!fs.existsSync(markdownFolder)) {
        return res.status(404).json({ message: "Файл новостей не найден" });
    }
    try {
        // Загружаем все объявления
        const indexPath = path.join(markdownFolder, "materials-index.json");
        const materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        // Ищем нужную новость по `id`
        const announcement = materialsIndex.find((ann) => String(ann.id) === id);
        if (!announcement) {
            return res.status(404).json({ message: "Новость не найдена" });
        }
        // Получаем группы новости (или пустой массив, если они не заданы)
        const group = Array.isArray(announcement.group) ? announcement.group : [];
        res.status(200).json({ group });
    } catch (error) {
        console.error("Ошибка при получении групп новости:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// Эндпоинт для чтения новостей на основе роли
// materialsRouter.get("/read", authenticateToken, (req, res) => {
//     const { id } = req.user;
//     const indexPath = path.join(markdownFolder, "materials-index.json");
//     const usersFile = path.join(__dirname, "users.json");
//     if (fs.existsSync(indexPath)) {
//         const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
//         const user = users.find((u) => u.id === id);
//         if (!user) {
//             return res.status(403).json({ message: "Пользователь не найден" });
//         }
//         const userRole = user.role; // Получаем актуальную роль
//         const userGroup = user.group; // Получаем актуальную группу
//         // Загружаем новости
//         let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
//         // Если роль admin, показываем все новости
//         if (userRole === "admin") {
//             return res.send(materialsIndex);
//         }
//         // Фильтруем новости по ролям и группам
//         let filteredMaterials = materialsIndex.filter(
//             (announcement) =>
//                 announcement.audience.includes(userRole) ||
//                 announcement.audience.includes("guest")
//         );
//         // Оставляем только новости, где `groups` пересекается с `userGroups`
//         const userGroups = Array.isArray(userGroup) ? userGroup : [userGroup]; // Превращаем в массив
//         if (filteredMaterials.length === 0) {
//             return res.json([]); // Всегда возвращаем пустой массив
//         }
//         res.send(filteredMaterials);
//     } else {
//         res.status(404).json({ message: "Список объявлений пуст" });
//     }
// });
materialsRouter.get("/read", authenticateToken, (req, res) => {
    const { id } = req.user;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    const usersFile = path.join(__dirname, "users.json");
    if (fs.existsSync(indexPath)) {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === id);
        if (!user) {
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        const userRole = user.role; // Получаем актуальную роль
        const userGroups = Array.isArray(user.group) ? user.group : [user.group]; // Преобразуем в массив
        // Загружаем новости
        let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        // Если роль admin, показываем все новости
        if (userRole === "admin") {
            // return res.send(materialsIndex);
            return res.json(materialsIndex.map((material) => ({ ...material, canEdit: true })));
        }
        // Фильтруем новости по ролям и группам
        // let filteredMaterials = materialsIndex.filter(
        //     (announcement) =>
        //         announcement.audience.includes(userRole) ||
        //         announcement.audience.includes("guest")
        // );
        // // Оставляем только новости, где `groups` пересекается с `userGroups`
        // const userGroups = Array.isArray(userGroup) ? userGroup : [userGroup]; // Превращаем в массив
        // if (filteredMaterials.length === 0) {
        //     return res.json([]); // Всегда возвращаем пустой массив
        // }
        // res.send(filteredMaterials);
        const filteredMaterials = materialsIndex
            .filter((material) => {
                const matchesRole =
                    (userRole === "guest" && material.audience.includes("guest")) || // Гость видит только гостевые объявления
                    (userRole !== "guest" && material.audience.includes(userRole));  // Остальные роли видят только свое
                const matchesGroup = Array.isArray(material.group) && material.group.some((group) => userGroups.includes(group));
                return matchesRole && matchesGroup;
            })
            .map((material) => ({
                ...material,
                canEdit: userRole === "teacher", // Только учителя могут редактировать
            }));
        // Возвращаем результат
        res.json(filteredMaterials);
    } else {
        res.status(404).json({ message: "Список объявлений пуст" });
    }
});

// Раздача статических файлов (если еще не добавлено)
materialsRouter.use("/files", express.static(uploadFolder));

// Эндпоинт для чтения конкретной новости по id
materialsRouter.get("/:id", authenticateToken, (req, res) => {
    const { id } = req.params; // Получаем ID из параметров маршрута
    const userId = req.user.id;
    const filePath = path.join(markdownFolder, `${id}.md`); // Путь к файлу новости
    const indexPath = path.join(markdownFolder, "materials-index.json"); // Путь к индексу новостей
    const usersFile = path.join(__dirname, "users.json");
    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Материал не найден" });
        }
        const content = fs.readFileSync(filePath, "utf-8");
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === userId);
        let materialsIndex = [];
        if (fs.existsSync(indexPath)) {
            try {
                materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
            } catch (err) {
                console.error("Ошибка парсинга индекса:", err);
                return res.status(500).json({ message: "Ошибка чтения индекса новостей" });
            }
        }
        // Ищем новость в индексе
        const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
        if (!materialsItem) {
            return res.status(404).json({ message: "Новость не найдена в индексе" });
        }
        // Определяем, может ли пользователь редактировать/удалять
        const canEdit = user.role === "teacher" || user.role === "admin";
        // Добавляем ссылку на изображение, если есть
        const imageUrl = materialsItem.image ? `${baseBackendUrl}/materials/test-image/${path.basename(materialsItem.image)}` : null;
        // Добавляем ссылки на файлы, если они есть
        const filesUrl = materialsItem.files ? materialsItem.files.map(file => ({
            url: `${baseBackendUrl}/materials/files/${path.basename(file)}`,
            name: file.split("_").slice(1).join("_")
        })) : [];
        let responseData = {
            id: materialsItem.id,
            title: materialsItem.title,
            content,
            image: imageUrl,
            files: filesUrl,
            audience: materialsItem.audience,
            canEdit,
        };
        res.status(200).json(responseData);
    } catch (err) {
        console.error("Ошибка обработки запроса:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// Эндпоинт для скачивания файла
materialsRouter.get("/materials/articles/files/:filename", (req, res) => {
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
materialsRouter.put("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const { title, content, audience, groups } = req.body;
    const filePath = path.join(markdownFolder, `${id}.md`);
    const indexPath = path.join(markdownFolder, "materials-index.json");
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
        let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        const index = materialsIndex.findIndex((materials) => String(materials.id) === id);
        if (index !== -1) {
            materialsIndex[index].title = title;
            materialsIndex[index].audience = audience;
            materialsIndex[index].group = groups;
            fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2), "utf-8");
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
materialsRouter.delete("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params; // ID из параметров маршрута
    const filePath = path.join(markdownFolder, `${id}.md`); // Путь к файлу новости
    const indexPath = path.join(markdownFolder, "materials-index.json"); // Путь к файлу индекса
    // Проверяем, существует ли файл новости
    if (fs.existsSync(filePath)) {
        // Удаляем файл с новостью
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Ошибка при удалении файла новости:", err);
                return res.status(500).send("Не удалось удалить новость");
            }
            try {
                // Обновляем materials-index.json
                let materialsIndex = [];
                if (fs.existsSync(indexPath)) {
                    materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
                }
                // Находим новость в индексе
                const materialsItem = materialsIndex.find((materials) => String(materials.id) === String(id));
                if (!materialsItem) {
                    return res.status(404).send("Новость не найдена в индексе");
                }
                // Удаляем связанный файл изображения, если он есть
                if (materialsItem.image) {
                    const imagePath = path.join(__dirname, materialsItem.image.replace("/uploads-materials/", "uploads-materials/"));
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
                if (materialsItem.files && Array.isArray(materialsItem.files)) {
                    materialsItem.files.forEach(file => {
                        const filePath = path.join(__dirname, file.replace("/uploads-materials/", "uploads-materials/"));
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    });
                }
                // Фильтруем индекс, удаляя запись с указанным ID
                materialsIndex = materialsIndex.filter((materials) => String(materials.id) !== String(id));
                // Записываем обновлённый индекс обратно в файл
                fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
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


materialsRouter.get("/test-image/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = filename;
    if (fs.existsSync(path.join(uploadFolder, filePath))) {
        res.sendFile(filePath, { root: uploadFolder }); // Указываем root как uploadFolder
    } else {
        res.status(404).json({ message: "Изображение не найдено" });
    }
});

materialsRouter.post("/:id/upload_image", authenticateToken, authorizeRole(["teacher", "admin"]), upload.single("image"), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    if (!req.file) {
        return res.status(400).send("Изображение не загружено");
    }
    const imageUrl = `/uploads-materials/${req.file.filename}`;
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
    if (!materialsItem) {
        return res.status(404).send("Новость не найдена");
    }
    materialsItem.image = imageUrl;
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    res.status(200).json({ message: "Изображение успешно загружено", imageUrl });
});

// Эндпоинт для удаления определенного фото
materialsRouter.delete("/:id/delete_image", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
    if (!materialsItem || !materialsItem.image) {
        return res.status(404).send("Изображение не найдено");
    }
    const imagePath = path.join(__dirname, materialsItem.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
    materialsItem.image = null;
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    res.status(200).send("Изображение успешно удалено");
});

materialsRouter.delete("/:id/:filename", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id, filename } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    console.log(`Запрос на удаление файла: ${filename} из новости: ${id}`);
    if (!fs.existsSync(indexPath)) {
        console.error("Файл индекса новостей не найден!");
        return res.status(404).json({ message: "Индекс новостей не найден" });
    }
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
    if (!materialsItem || !materialsItem.files) {
        console.error("Новость или файлы не найдены в индексе!");
        return res.status(404).json({ message: "Новость или файлы не найдены" });
    }
    console.log("Список файлов в новости:", materialsItem.files);
    // Найдём файл, игнорируя временной штамп
    const fileToDelete = materialsItem.files.find((file) => {
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
    materialsItem.files = materialsItem.files.filter((file) => file !== fileToDelete);
    // Обновляем `materials-index.json`
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    console.log(`Файл ${filename} успешно удален из JSON индекса`);
    res.status(200).json({ message: "Файл успешно удален" });
});


// Добавление новых файлов в новость
materialsRouter.post("/:id", authenticateToken, authorizeRole(["teacher", "admin"]), upload.array("files", 5), (req, res) => {
    const { id } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    if (!fs.existsSync(indexPath)) {
        return res.status(404).json({ message: "Индекс новостей не найден" });
    }
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find(materials => String(materials.id) === id);
    if (!materialsItem) {
        return res.status(404).json({ message: "Новость не найдена" });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Файлы не загружены" });
    }
    // Записываем файлы как строки, а не объекты
    const newFiles = req.files.map(file => `/uploads-materials/${file.filename}`);
    // Обновляем список файлов
    materialsItem.files = [...(materialsItem.files || []), ...newFiles];
    // Перезаписываем materials-index.json
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2), "utf-8");
    res.status(200).json({ message: "Файлы успешно добавлены", files: newFiles });
});

// Создание статьи внутри новости
materialsRouter.post("/:id/articles", authenticateToken, authorizeRole(["admin", "teacher"]), (req, res) => {
    const { id } = req.params;
    const { title, content, audience } = req.body;
    const articlesFolder = path.join(__dirname, "markdown-files-articles");
    const materialsFile = path.join(markdownFolder, "materials-index.json");
    try {
        // Проверяем, существует ли файл материалов
        if (!fs.existsSync(materialsFile)) {
            return res.status(404).json({ message: "Файл материалов не найден" });
        }
        let materials = JSON.parse(fs.readFileSync(materialsFile, "utf-8"));
        // Ищем нужный материал
        const materialIndex = materials.findIndex((m) => String(m.id) === id);
        if (materialIndex === -1) {
            return res.status(404).json({ message: "Материал не найден" });
        }
        // Проверяем, есть ли массив `articles`, если нет — создаём
        if (!Array.isArray(materials[materialIndex].articles)) {
            materials[materialIndex].articles = [];
        }
        // Генерируем новый ID статьи
        const articleId = Date.now().toString();
        // Создаём новую статью
        const newArticle = {
            id: articleId,
            title,
            content, // Храним краткое описание (если нужно)
            audience: audience || [],
            image: null,
            files: []
        };
        // Добавляем статью в массив `articles` у материала
        materials[materialIndex].articles.push(newArticle);
        // Сохраняем `.md` файл с контентом статьи
        if (!fs.existsSync(articlesFolder)) {
            fs.mkdirSync(articlesFolder, { recursive: true });
        }
        fs.writeFileSync(path.join(articlesFolder, `${articleId}.md`), content, "utf-8");
        // Обновляем `materials-index.json`
        fs.writeFileSync(materialsFile, JSON.stringify(materials, null, 2));
        res.status(201).json({ message: "Статья создана", article: newArticle });
    } catch (error) {
        console.error("Ошибка при создании статьи:", error);
        res.status(500).json({ message: "Ошибка при создании статьи" });
    }
});


// Получение списка статей внутри новости
// materialsRouter.get("/:id/articles", (req, res) => {
//     const { id } = req.params;
//     const indexPath = path.join(markdownFolder, "materials-index.json");
//     if (!fs.existsSync(indexPath)) {
//         return res.status(404).json({ message: "Файл индекса не найден" });
//     }
//     const materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
//     const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
//     if (!materialsItem || !materialsItem.articles) {
//         return res.status(404).json({ message: "Статьи не найдены" });
//     }
//     res.status(200).json(materialsItem.articles);
// });
// Получение списка статей внутри новости
materialsRouter.get("/:id/articles", authenticateToken , (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    const usersFile = path.join(__dirname, "users.json");
    if (!fs.existsSync(indexPath)) {
        return res.status(404).json({ message: "Файл индекса не найден" });
    }
    try {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === userId);
        if (!user) {
            console.log("Пользователь не найден в users.json:", userId);
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        const userRole = user.role; // Получаем роль пользователя
        const userGroups = Array.isArray(user.group) ? user.group : [user.group]; // Преобразуем в массив
        let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        let materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
        if (!materialsItem || !materialsItem.articles) {
            return res.status(404).json({ message: "Статьи не найдены" });
        }
        let articlesItem = materialsItem.articles;
        if (userRole === "admin") {
            return res.json(articlesItem.map((articles) => ({ ...articles, canEdit: true })));
        }
        console.log(userRole);
        console.log(userGroups);
        console.log(articlesItem);
        const filteredArticles = articlesItem
            // .filter((articles) => {
            //     const matchesRole =
            //         (userRole !== "guest" && articles.audience.includes(userRole));  // Остальные роли видят только свое
            //     const matchesGroup = Array.isArray(articles.group) && articles.group.some((group) => userGroups.includes(group));
            //     return matchesRole && matchesGroup;
            // })
            .map((articles) => ({
                ...articles,
                canEdit: userRole === "teacher",
            }));
        res.json(filteredArticles);
    } catch (error) {
        console.error("Ошибка при чтении статей:", error);
        res.status(500).json({ message: "Ошибка сервера при обработке статей" });
    }
});

// Получение конкретной статьи
// materialsRouter.get("/:id/articles/:articleId", (req, res) => {
//     const { id, articleId } = req.params;
//     const userRole = req.role;
//     const materialsFile = path.join(markdownFolder, "materials-index.json");
//     const articlesFolder = path.join(__dirname, "markdown-files-articles");
//     try {
//         // Читаем файл материалов
//         if (!fs.existsSync(materialsFile)) {
//             return res.status(404).json({ message: "Файл материалов не найден" });
//         }
//         const materials = JSON.parse(fs.readFileSync(materialsFile, "utf-8"));
//         // Ищем нужный материал
//         const material = materials.find((m) => String(m.id) === id);
//         if (!material) {
//             return res.status(404).json({ message: "Материал не найден" });
//         }
//         // Ищем статью внутри материала
//         const article = material.articles.find((a) => String(a.id) === articleId);
//         if (!article) {
//             return res.status(404).json({ message: "Статья не найдена" });
//         }
//         // Загружаем контент статьи из `.md` файла (если он есть)
//         const filePath = path.join(articlesFolder, `${articleId}.md`);
//         let content = article.content; // Используем `content` из JSON по умолчанию
//         if (fs.existsSync(filePath)) {
//             content = fs.readFileSync(filePath, "utf-8");
//         }
//         // Формируем ответ
//         let responseData = {
//             id: article.id,
//             title: article.title,
//             content,
//             image: article.image ? `${baseBackendUrl}/materials/test-image/${path.basename(article.image)}` : null,
//             files: article.files.map(file => ({
//                 url: `${baseBackendUrl}/materials/files/${path.basename(file)}`,
//                 name: file.split("_").slice(1).join("_")
//             }))
//         };
//         // Если роль НЕ user и НЕ student, добавляем `audience`
//         if (userRole !== "user" && userRole !== "student") {
//             responseData.audience = material.audience || [];
//         }
//         res.status(200).json(responseData);
//     } catch (err) {
//         console.error("Ошибка обработки запроса:", err);
//         res.status(500).json({ message: "Внутренняя ошибка сервера" });
//     }
// });
materialsRouter.get("/:id/articles/:articleId", authenticateToken , (req, res) => {
    const { id, articleId } = req.params;
    const userId = req.user.id;
    const materialsFile = path.join(markdownFolder, "materials-index.json");
    const articlesFolder = path.join(__dirname, "markdown-files-articles");
    const usersFile = path.join(__dirname, "users.json");
    try {
        // Читаем список пользователей
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const user = users.find((u) => u.id === userId);
        if (!user) {
            console.log("Пользователь не найден в users.json:", userId);
            return res.status(403).json({ message: "Пользователь не найден" });
        }
        const userRole = user.role;
        const userGroups = Array.isArray(user.group) ? user.group : [user.group];
        if (!fs.existsSync(materialsFile)) {
            return res.status(404).json({ message: "Файл материалов не найден" });
        }
        const materials = JSON.parse(fs.readFileSync(materialsFile, "utf-8"));
        const material = materials.find((m) => String(m.id) === id);
        if (!material) {
            return res.status(404).json({ message: "Материал не найден" });
        }
        const article = material.articles.find((a) => String(a.id) === articleId);
        if (!article) {
            return res.status(404).json({ message: "Статья не найдена" });
        }
        // Проверяем доступ по ролям и группам
        // const hasAccess =
        //     article.audience.includes(userRole) ||
        //     article.audience.includes("guest") ||
        //     (Array.isArray(article.group) && article.group.some((group) => userGroups.includes(group)));
        //
        // if (!hasAccess) {
        //     return res.status(403).json({ message: "У вас нет доступа к этой статье" });
        // }
        // Загружаем контент статьи из `.md` файла (если он есть)
        const filePath = path.join(articlesFolder, `${articleId}.md`);
        let content = article.content; // Используем `content` из JSON по умолчанию
        if (fs.existsSync(filePath)) {
            content = fs.readFileSync(filePath, "utf-8");
        }
        // Формируем ответ
        let responseData = {
            id: article.id,
            title: article.title,
            content,
            image: article.image ? `${baseBackendUrl}/materials/test-image/${path.basename(article.image)}` : null,
            files: article.files
                ? article.files.map((file) => ({
                    url: `${baseBackendUrl}/materials/files/${path.basename(file)}`,
                    name: file.split("_").slice(1).join("_"),
                }))
                : [], // Если файлов нет, передаём пустой массив
            canEdit: userRole === "teacher" || userRole === "admin",
        };
        res.status(200).json(responseData);
    } catch (err) {
        console.error("Ошибка обработки запроса:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});


// Удаление статьи
materialsRouter.delete("/:id/articles/:articleId", authenticateToken, authorizeRole(["admin", "teacher"]), (req, res) => {
    const { id, articleId } = req.params;
    const articlesFolder = path.join(__dirname, "markdown-files-articles");
    const materialsFile = path.join(markdownFolder, "materials-index.json");
    try {
        // Загружаем список материалов
        if (!fs.existsSync(materialsFile)) {
            return res.status(404).json({ message: "Файл материалов не найден" });
        }
        let materials = JSON.parse(fs.readFileSync(materialsFile, "utf-8"));
        // Ищем нужный материал
        const materialIndex = materials.findIndex((m) => String(m.id) === id);
        if (materialIndex === -1) {
            return res.status(404).json({ message: "Материал не найден" });
        }
        // Фильтруем статьи, исключая удаляемую
        const updatedArticles = materials[materialIndex].articles.filter(article => String(article.id) !== articleId);
        // Если статья не найдена, возвращаем ошибку
        if (updatedArticles.length === materials[materialIndex].articles.length) {
            return res.status(404).json({ message: "Статья не найдена" });
        }
        // Обновляем `articles` у материала
        materials[materialIndex].articles = updatedArticles;
        // Удаляем `.md` файл статьи (если существует)
        const articlePath = path.join(articlesFolder, `${articleId}.md`);
        if (fs.existsSync(articlePath)) {
            fs.unlinkSync(articlePath);
        }
        // Сохраняем изменения в `materials-index.json`
        fs.writeFileSync(materialsFile, JSON.stringify(materials, null, 2));
        res.status(200).json({ message: "Статья удалена" });
    } catch (error) {
        console.error("Ошибка при удалении статьи:", error);
        res.status(500).json({ message: "Ошибка при удалении статьи" });
    }
});

// Эндпоинт для обновления статьи
materialsRouter.put("/:id/articles/:articleId", authenticateToken, authorizeRole(["admin", "teacher"]), (req, res) => {
    const { id, articleId } = req.params;
    const { title, content, audience } = req.body;
    const articlesFolder = path.join(__dirname, "markdown-files-articles");
    const materialsFile = path.join(markdownFolder, "materials-index.json");
    try {
        // Загружаем список материалов
        if (!fs.existsSync(materialsFile)) {
            return res.status(404).json({ message: "Файл материалов не найден" });
        }
        let materials = JSON.parse(fs.readFileSync(materialsFile, "utf-8"));
        // Ищем нужный материал
        const materialIndex = materials.findIndex((m) => String(m.id) === id);
        if (materialIndex === -1) {
            return res.status(404).json({ message: "Материал не найден" });
        }
        // Ищем нужную статью
        const articleIndex = materials[materialIndex].articles.findIndex(article => String(article.id) === articleId);
        if (articleIndex === -1) {
            return res.status(404).json({ message: "Статья не найдена" });
        }
        // Обновляем данные статьи
        materials[materialIndex].articles[articleIndex].title = title;
        materials[materialIndex].articles[articleIndex].audience = audience || [];
        // Сохраняем `.md` файл с обновленным контентом
        const articlePath = path.join(articlesFolder, `${articleId}.md`);
        fs.writeFileSync(articlePath, content, "utf-8");
        // Обновляем `materials-index.json`
        fs.writeFileSync(materialsFile, JSON.stringify(materials, null, 2));
        res.status(200).json({ message: "Статья обновлена", article: materials[materialIndex].articles[articleIndex] });
    } catch (error) {
        console.error("Ошибка при редактировании статьи:", error);
        res.status(500).json({ message: "Ошибка при редактировании статьи" });
    }
});

// Эндпоинт для скачивания файла //посмотреть что да как
materialsRouter.get("/articles/files/:filename", (req, res) => {
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

materialsRouter.get("/test-image/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = filename;
    if (fs.existsSync(path.join(uploadFolder, filePath))) {
        res.sendFile(filePath, { root: uploadFolder }); // Указываем root как uploadFolder
    } else {
        res.status(404).json({ message: "Изображение не найдено" });
    }
});

materialsRouter.post("/:id/articles/:articleId/upload_image", authenticateToken, authorizeRole(["teacher", "admin"]), upload.single("image"), (req, res) => {
    const { id, articleId } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    if (!req.file) {
        return res.status(400).send("Изображение не загружено");
    }
    const imageUrl = `/uploads-materials/${req.file.filename}`;
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
    if (!materialsItem) {
        return res.status(404).send("Новость не найдена");
    }
    // Ищем нужную статью
    const articleItem = materialsItem.articles.find((article) => String(article.id) === articleId);
    if (!articleItem) {
        return res.status(404).send("Статья не найдена");
    }
    // Сохраняем изображение в конкретную статью
    articleItem.image = imageUrl;
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    res.status(200).json({ message: "Изображение успешно загружено", imageUrl });
});

// Эндпоинт для удаления определенного фото
materialsRouter.delete("/:id/articles/:articleId/delete_image", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id, articleId } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
    const articleItem = materialsItem.articles.find((article) => String(article.id) === articleId);
    const imagePath = path.join(__dirname, articleItem.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
    articleItem.image = null;
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    res.status(200).send("Изображение успешно удалено");
});

// удаление файлов статьи
materialsRouter.delete("/:id/articles/:articleId/:filename", authenticateToken, authorizeRole(["teacher", "admin"]), (req, res) => {
    const { id, articleId, filename } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    console.log(`Запрос на удаление файла: ${filename} из статьи: ${articleId} в материале: ${id}`);
    if (!fs.existsSync(indexPath)) {
        console.error("Файл индекса статей не найден!");
        return res.status(404).json({ message: "Индекс статей не найден" });
    }
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialItem = materialsIndex.find((material) => String(material.id) === id);
    if (!materialItem || !materialItem.articles) {
        console.error("Материал или статьи не найдены в индексе!");
        return res.status(404).json({ message: "Материал или статьи не найдены" });
    }
    const articleItem = materialItem.articles.find((article) => String(article.id) === articleId);
    if (!articleItem || !articleItem.files) {
        console.error("Статья или файлы не найдены!");
        return res.status(404).json({ message: "Статья или файлы не найдены" });
    }
    console.log("Список файлов в статье:", articleItem.files);
    // Найдём файл, игнорируя временной штамп
    const fileToDelete = articleItem.files.find((file) => {
        const fileBaseName = path.basename(file);
        return fileBaseName.includes(`_${filename}`); // Ищем файл, который заканчивается на нужное имя
    });
    if (!fileToDelete) {
        console.error(`Файл ${filename} не найден в списке файлов статьи!`);
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
    // Удаляем файл из массива `files` статьи
    articleItem.files = articleItem.files.filter((file) => file !== fileToDelete);
    // Обновляем `materials-index.json`
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    console.log(`Файл ${filename} успешно удален из JSON индекса`);
    res.status(200).json({ message: "Файл успешно удален" });
});


// Добавление новых файлов в новость
materialsRouter.post("/:id/articles/:articleId/upload_files", authenticateToken, authorizeRole(["teacher", "admin"]), upload.array("files", 5), (req, res) => {
    const { id, articleId } = req.params;
    const indexPath = path.join(markdownFolder, "materials-index.json");
    if (!fs.existsSync(indexPath)) {
        return res.status(404).json({ message: "Индекс материалов не найден" });
    }
    let materialsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const materialsItem = materialsIndex.find((materials) => String(materials.id) === id);
    if (!materialsItem) {
        return res.status(404).json({ message: "Материал не найден" });
    }
    // Найти статью внутри материала
    const articleItem = materialsItem.articles.find((article) => String(article.id) === articleId);
    if (!articleItem) {
        return res.status(404).json({ message: "Статья не найдена" });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Файлы не загружены" });
    }
    // Записываем файлы в массив `files` статьи
    const newFiles = req.files.map(file => `/uploads-materials/${file.filename}`);
    articleItem.files = [...(articleItem.files || []), ...newFiles];
    // Обновляем `materials-index.json`
    fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2), "utf-8");
    res.status(200).json({ message: "Файлы успешно добавлены в статью", files: newFiles });
});


module.exports = materialsRouter;
