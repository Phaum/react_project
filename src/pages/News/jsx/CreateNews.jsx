import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import "../css/CreateNews.css";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";

const CreateNews = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [audience, setAudience] = useState([]);
    const [image, setImage] = useState(null); // Состояние для фото
    const [files, setFiles] = useState([]); // Состояние для файлов
    const navigate = useNavigate(); // Хук для навигации
    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setAudience((prev) => [...prev, value]);
        } else {
            setAudience((prev) => prev.filter((role) => role !== value));
        }
    };

    const handleImageChange = (event) => {
        setImage(event.target.files[0]); // Устанавливаем выбранный файл
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Проверка, что хотя бы один чекбокс выбран
        if (audience.length === 0) {
            alert("Пожалуйста, выберите хотя бы одну аудиторию");
            return;
        }
        const token = localStorage.getItem("token");
        const formData = new FormData(); // Используем FormData для отправки файлов
        formData.append("title", title);
        formData.append("content", content);
        formData.append("audience", JSON.stringify(audience));
        if (image) formData.append("image", image);
        files.forEach(file => formData.append("files", file));
        try {
            const response = await fetch("http://localhost:5000/news/create_news", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Токен для авторизации
                },
                body: formData, // Передаём FormData
            });
            if (response.ok) {
                alert("Новость успешно создана");
                setTitle(""); // Сброс значений
                setContent("");
                setAudience([]);
                setImage(null);
                navigate("/news");
            } else {
                console.error("Ошибка при создании новости:", await response.text());
                navigate("/news");
            }
        } catch (error) {
            console.error("Ошибка при создании новости:", error);
        }
    };

    return (
        <div className="main-container">
            <h1>Создать новость</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Аудитория:</label>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                value="guest"
                                onChange={handleCheckboxChange}
                            />
                            Гости
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="student"
                                onChange={handleCheckboxChange}
                            />
                            Студенты
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="teacher"
                                onChange={handleCheckboxChange}
                            />
                            Учителя
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="admin"
                                onChange={handleCheckboxChange}
                            />
                            Администраторы
                        </label>
                    </div>
                </div>
                <div>
                    <label>Заголовок: (Markdown)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="content">Содержание (Markdown):</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        required
                    />
                </div>
                <div>
                    <label>Отображаемое Фото:</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
                <div>
                    <label>Прикрепленные файлы (до 5 файлов):</label>
                    <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} />
                </div>
                <h2>Предварительный просмотр</h2>
                <div className="preview">
                    <MarkdownRenderer content={content} />
                </div>
                <div className="fixed-buttons-container">
                    <button type="submit">Создать</button>
                </div>
            </form>
        </div>
    );
};

export default CreateNews;