import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Announcements.css";
import MarkdownRenderer from "../../../UI/MarkdownRenderer";

const Announcements = () => {
    const [announcementsList, setAnnouncementsList] = useState([]); // Список новостей
    const [loading, setLoading] = useState(true); // Состояние загрузки
    const [error, setError] = useState(null); // Ошибки при загрузке новостей
    const [role, setRole] = useState("guest");
    const navigate = useNavigate(); // Для перенаправления после сохранения

    // Функция для получения токена
    const getToken = () => localStorage.getItem("token");

    // Функция для загрузки новостей
    const fetchAnnouncements = async () => {
        const token = getToken();
        const endpoint = token
            ? "http://localhost:5000/announcements/read"
            : "http://localhost:5000/announcements/read_guest";
        try {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAnnouncementsList(data);
                if (token) {
                    const storedRole = localStorage.getItem("role");
                    setRole(storedRole || "guest");
                }
            } else {
                const errorMessage = await response.text();
                setError(`Ошибка при загрузке новостей: ${errorMessage}`);
                navigate("/registration");
            }
        } catch (error) {
            setError("Произошла ошибка при загрузке новостей");
        } finally {
            setLoading(false);
        }
    };

    // Функция для удаления новости
    const deleteAnnouncements = async (id) => {
        const token = getToken();
        try {
            const response = await fetch(`http://localhost:5000/announcements/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                alert("Новость успешно удалена");
                setAnnouncementsList((prevAnnouncements) => prevAnnouncements.filter((announcements) => announcements.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить новость: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении новости");
        }
    };

    useEffect(() => {
        fetchAnnouncements(); // Загружаем новости при монтировании компонента
    }, []);

    // Отображение загрузки
    if (loading) {
        return <p>Загрузка...</p>;
    }

    // Отображение ошибок
    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="main-container">
            <h1>Объявления</h1>
            {(role === "teacher" || role === "admin") && (
                        <div className="announcements-container">
                            <Link to="/create_announcements" className="create-announcements-button">
                                Создать объявление
                            </Link>
                        </div>
                    )}
            {announcementsList.length > 0 ? (
                announcementsList.map((announcements) => (
                    <div className="announcements-container" key={announcements.id}>
                        <div className="text-block">
                            <div>
                                <Link to={`/announcements/${announcements.id}`} className="view-announcements-button">
                                    <MarkdownRenderer content={announcements.title}/>
                                </Link>
                            </div>
                        </div>
                        {(role === "teacher" || role === "admin") && (
                            <div className="text-block">
                                <h2>
                                    <Link to={`/announcements/edit/${announcements.id}`} className="edit-button">
                                        Редактировать
                                    </Link>
                                </h2>
                                <button
                                    onClick={() => deleteAnnouncements(announcements.id)}
                                    className="delete-button"
                                >
                                    Удалить объявление
                                </button>
                            </div>
                         )}
                    </div>
                ))
            ) : (
                <p>Пока нет объявлений</p>
            )}
        </div>
    );
};

export default Announcements;
