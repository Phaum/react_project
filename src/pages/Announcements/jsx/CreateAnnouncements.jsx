import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import "../css/CreateAnnouncements.css";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import {baseBackendUrl} from "../../../shared/constants"

const CreateAnnouncements = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [audience, setAudience] = useState([]);
    const [image, setImage] = useState(null);
    const [files, setFiles] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${baseBackendUrl}/announcements/groups`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error("Ошибка при загрузке групп");
                }
                const data = await response.json();
                setGroups(data);
            } catch (error) {
                console.error(error.message);
            }
        };
        fetchGroups();
    }, []);

    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;
        setAudience((prev) => (checked ? [...prev, value] : prev.filter((role) => role !== value)));
    };

    const handleImageChange = (event) => {
        setImage(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (audience.length === 0) {
            alert("Пожалуйста, выберите хотя бы одну аудиторию");
            return;
        }
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("audience", JSON.stringify(audience));
        formData.append("groups", JSON.stringify(selectedGroups));
        if (image) formData.append("image", image);
        files.forEach(file => formData.append("files", file));
        try {
            const response = await fetch(`${baseBackendUrl}/announcements/create_announcements`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (response.ok) {
                alert("Новость успешно создана");
                setTitle("");
                setContent("");
                setAudience([]);
                setSelectedGroups([]);
                setImage(null);
                navigate("/announcements");
            } else {
                console.error("Ошибка при создании новости:", await response.text());
                navigate("/announcements");
            }
        } catch (error) {
            console.error("Ошибка при создании новости:", error);
        }
    };

    return (
        <div>
            <h1>Создать объявление</h1>
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
                <table border="1">
                    <thead>
                    <tr>
                        <th>Выбрать</th>
                        <th>Название группы</th>
                    </tr>
                    </thead>
                    <tbody>
                    {groups.map((group) => (
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
                                                ? prevSelected.filter((g) => g !== value)
                                                : [...prevSelected, value]
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

export default CreateAnnouncements;