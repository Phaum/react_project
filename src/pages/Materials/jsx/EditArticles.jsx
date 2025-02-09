import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";

const EditArticle = () => {
    const { id, articleId } = useParams(); // Получаем ID материала и статьи
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null); // Состояние для текущего изображения
    const [newImage, setNewImage] = useState(null); // Состояние для нового изображения
    const [files, setFiles] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [error, setError] = useState(null);
    const getToken = () => localStorage.getItem("token");
    // Загрузка данных статьи
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const token = getToken();
                const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });
                if (!response.ok) throw new Error("Ошибка загрузки статьи");
                const data = await response.json();
                setTitle(data.title);
                setContent(data.content);
                setImage(data.image); // Сохраняем URL текущего изображения
                setFiles(data.files || []); // файлы
            } catch (error) {
                console.error("Ошибка при загрузке статьи", error);
                setError(error.message);
            }
        };

        fetchArticle();
    }, [id, articleId]);

    // 📌 Обновление статьи
    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, content }),
            });
            if (!response.ok) throw new Error("Ошибка при обновлении статьи");
            alert("Статья успешно обновлена!");
            navigate(`/materials/${id}/articles/${articleId}`); // Перенаправляем назад к материалам
        } catch (error) {
            setError(error.message);
        }
    };

    // Обработка загрузки нового изображения
    const handleImageUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("image", newImage);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}/upload_image`, {
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
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}/delete_image`, {
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
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}/${filename}`, {
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

    // загрузка дополнительных файлов
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
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}/upload_files`, {
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
        <div>
            <h1>Редактирование статьи</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleUpdate}>
                <div>
                    <label>Заголовок: (Markdown)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Содержание: (Markdown)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        required
                    />
                </div>
                {image && (
                    <div>
                        <p>Текущее изображение:</p>
                        <img className="materials-container" src={image} alt={title} width="50%"/>
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
                        <li key={file.name}>
                            {/*<a href={file.url} download>{file.name}</a>*/}
                            <DownloadFile file={file} />
                            <button className="delete-button" onClick={(e) => handleFileDelete(e,file.name)}>Удалить</button>
                        </li>
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

export default EditArticle;
