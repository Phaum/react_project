import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";

const EditAnnouncements = () => {
    const { id } = useParams(); // Получаем ID новости из URL
    const [title, setTitle] = useState(""); // Состояние для заголовка
    const [content, setContent] = useState(""); // Состояние для содержимого
    const [image, setImage] = useState(null); // Состояние для текущего изображения
    const [newImage, setNewImage] = useState(null); // Состояние для нового изображения
    const [files, setFiles] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [error, setError] = useState(null); // Для ошибок
    const navigate = useNavigate(); // Для перенаправления после сохранения
    const [audience, setAudience] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]); // Выбранные группы
    const [allGroups, setAllGroups] = useState([]); // Все доступные группы
    const token = localStorage.getItem("token");

    // Загружаем данные новости для редактирования
    useEffect(() => {
        const getToken = () => localStorage.getItem("token");
        const fetchAnnouncements = async () => {
            try {
                const token = getToken();
                const response = await fetch(`http://localhost:5000/announcements/${id}`,{
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && {Authorization: `Bearer ${token}`}),
                    },
                });
                if (!response.ok) {
                    throw new Error("Не удалось загрузить данные новости");
                }
                const data = await response.json();
                setTitle(data.title);
                setContent(data.content);
                setImage(data.image); // Сохраняем URL текущего изображения
                setFiles(data.files || []); // Загружаем файлы
                setAudience(data.audience || []); // Загружаем аудиторию
                setSelectedGroups(data.groups || []); // Заполняем группы из данных
            } catch (error) {
                console.error("Ошибка при загрузке новости:", error);
                setError("Ошибка при загрузке данных");
                navigate("/announcements");
            }
        };
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");
                const groupsResponse = await fetch("http://localhost:5000/announcements/groups", {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                const newsResponse = await fetch(`http://localhost:5000/announcements/${id}/groups`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });

                if (!groupsResponse.ok || !newsResponse.ok) {
                    throw new Error("Ошибка загрузки данных");
                }
                const allGroupsData = await groupsResponse.json(); // Получаем список всех групп
                const newsData = await newsResponse.json(); // Данные конкретной новости
                setAllGroups(allGroupsData || []); // Устанавливаем список всех групп
                setSelectedGroups(newsData.group || []); // Устанавливаем группы, связанные с новостью
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
                setAllGroups([]);
                setSelectedGroups([]);
            }
        };
        fetchAnnouncements();
        fetchGroups();
    }, [id, token]);

    // Обработчик выбора аудитории
    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setAudience((prev) => [...prev, value]);
        } else {
            setAudience((prev) => prev.filter((role) => role !== value));
        }
    };

    // Обработка обновления новости
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token"); // Добавляем токен из localStorage
            const response = await fetch(`http://localhost:5000/announcements/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Передаём токен
                },
                body: JSON.stringify({ title, content, audience, groups: selectedGroups }),
            });
            if (response.ok) {
                alert("Новость успешно обновлена");
                navigate(`/announcements/${id}`); // Перенаправляем на страницу новостей
            } else {
                const errorMessage = await response.text();
                console.error("Ошибка при обновлении новости:", errorMessage);
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка при обновлении новости:", error);
            alert("Произошла ошибка при обновлении");
        }
    };

    // Обработка загрузки нового изображения
    const handleImageUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("image", newImage);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/announcements/${id}/upload_image`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                setImage(data.imageUrl); // Обновляем URL изображения
                alert("Изображение успешно загружено");
                window.location.reload();
            } else {
                const errorMessage = await response.text();
                console.error("Ошибка при загрузке изображения:", errorMessage);
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка при загрузке изображения:", error);
            alert("Произошла ошибка при загрузке изображения");
        }
    };

    // Обработка удаления изображения
    const handleImageDelete = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/announcements/${id}/delete_image`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                setImage(null); // Удаляем изображение из состояния
                alert("Изображение успешно удалено");
                window.location.reload();
            } else {
                const errorMessage = await response.text();
                console.error("Ошибка при удалении изображения:", errorMessage);
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка при удалении изображения:", error);
            alert("Произошла ошибка при удалении изображения");
        }
    };

    if (error) {
        return <p>{error}</p>; // Отображение ошибки при загрузке
    }

    // Удаление файла
    const handleFileDelete = async (e, fileUrl) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const filename = decodeURIComponent(fileUrl.split("/").pop()); // Декодируем имя файла
            const response = await fetch(`http://localhost:5000/announcements/${id}/${filename}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка при удалении файла: ${errorMessage}`);
            }
            setFiles((prevFiles) => prevFiles.filter((file) => file.url !== fileUrl)); // Удаляем из списка
            alert("Файл успешно удален");
            window.location.reload();
        } catch (error) {
            console.error("❌ Ошибка удаления файла:", error);
            alert(`Ошибка удаления файла: ${error.message}`);
        }
    };
    const uploadNewFilesDop = async (e) => {
        e.preventDefault();
        if (newFiles.length === 0) {
            alert("Выберите файлы для загрузки");
            return;
        }
        const token = localStorage.getItem("token");
        const formData = new FormData();
        newFiles.forEach((file) => formData.append("files", file));
        try {
            const response = await fetch(`http://localhost:5000/announcements/${id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Ошибка при загрузке файлов");
            }
            const data = await response.json();
            setFiles((prev) => [...prev, ...data.files]); // Обновляем список файлов
            setNewFiles([]); // Очищаем выбранные файлы
            alert("Файлы успешно загружены");
            window.location.reload();
        } catch (error) {
            console.error("Ошибка загрузки файлов:", error);
            alert("Ошибка загрузки файлов");
        }
    };

    return (
        <div className="main-container">
            <h1>Редактировать объявление</h1>
            <form onSubmit={handleUpdate}>
                <div>
                    <label htmlFor="title">Заголовок:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Аудитория:</label>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                value="guest"
                                checked={audience.includes("guest")}
                                onChange={handleCheckboxChange}
                            />
                            Гости
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="student"
                                checked={audience.includes("student")}
                                onChange={handleCheckboxChange}
                            />
                            Студенты
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="teacher"
                                checked={audience.includes("teacher")}
                                onChange={handleCheckboxChange}
                            />
                            Учителя
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="admin"
                                checked={audience.includes("admin")}
                                onChange={handleCheckboxChange}
                            />
                            Администраторы
                        </label>
                    </div>
                </div>
                <h3>Выберите группы:</h3>
                <table border="1">
                    <thead>
                    <tr>
                        <th>Выбрать</th>
                        <th>Название группы</th>
                    </tr>
                    </thead>
                    <tbody>
                    {allGroups.map((group) => (
                        <tr key={group}>
                            <td>
                                <input
                                    type="checkbox"
                                    value={group}
                                    checked={selectedGroups.includes(group)}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSelectedGroups((prevSelected) =>
                                            prevSelected.includes(value)
                                                ? prevSelected.filter((g) => g !== value) // Удаление, если уже выбрано
                                                : [...prevSelected, value] // Добавление, если не выбрано
                                        );
                                    }}
                                />
                            </td>
                            <td>{group}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div>
                    <label htmlFor="content">Содержание:</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        required
                    />
                </div>
                {image && (
                    <div>
                        <p>Текущее изображение:</p>
                        <img className="announcements-container" src={image} alt={title} width="50%"/>
                        <button className="delete-button" type="button" onClick={handleImageDelete}>
                            Удалить изображение
                        </button>
                    </div>
                )}
                <div>
                    <label htmlFor="newImage">Загрузить новое изображение:</label>
                    <input
                        type="file"
                        id="newImage"
                        accept="image/*"
                        onChange={(e) => setNewImage(e.target.files[0])}
                    />
                    <button type="button" onClick={handleImageUpload}>
                        Загрузить
                    </button>
                </div>
                <h3>Прикрепленные файлы:</h3>
                <ul>
                    {files.map((file) => (
                        <div key={file.name}>
                            <DownloadFile file={file} />
                            <button className="delete-button" onClick={(e) => handleFileDelete(e,file.name)}>Удалить</button>
                        </div>
                    ))}
                </ul>
                <div>
                    <label>Добавить файлы (до 5 файлов):</label>
                    <input
                        type="file"
                        multiple
                        onChange={(e) => setNewFiles([...e.target.files])}
                    />
                    <button onClick={uploadNewFilesDop}>Загрузить файлы</button>
                </div>
                <h2>Предварительный просмотр</h2>
                <div className="preview">
                    <MarkdownRenderer content={content} />
                </div>
                <div className="fixed-buttons-container">
                    <button type="submit">Сохранить изменения</button>
                </div>
            </form>
        </div>
    );
};

export default EditAnnouncements;
