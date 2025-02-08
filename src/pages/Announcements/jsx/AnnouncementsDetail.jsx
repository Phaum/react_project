import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate  } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import "../css/AnnouncementsDetail.css";

const AnnouncementsDetail = () => {
    const { id } = useParams(); // Получаем ID из параметров маршрута
    const [announcements, setAnnouncements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate(); // Хук для навигации

    // Функция для получения токена
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        // Функция для загрузки данных о конкретной новости
        const fetchAnnouncementsDetail = async () => {
            const token = getToken();
            const endpoint = token
                ? "http://localhost:5000/announcements/read"
                : "http://localhost:5000/announcements/read_guest";
            try {
                const response = await fetch(`http://localhost:5000/announcements/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });
                if (!response.ok) {
                    throw new Error("Не удалось загрузить новость");
                }
                const data = await response.json();
                if (token) {
                    const storedRole = localStorage.getItem("role");
                    setRole(storedRole || "guest");
                }
                setAnnouncements(data); // Сохраняем данные о новости
                // console.log("Пришедшие данные новости:", data); // Логируем ответ
            } catch (error) {
                console.error("Ошибка при загрузке новости:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncementsDetail();
    }, [id]);

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
                navigate("/announcements");
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить объявление: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении объявления");
        }
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>Ошибка: {error}</p>;
    }

    if (!announcements) {
        return <p>Новость не найдена.</p>;
    }

    return (
        <div className="main-container">
            <div>
                <MarkdownRenderer content={announcements.title}/>
                {announcements.image ? (
                    <img className="announcements-container" src={announcements.image} alt={announcements.title} width="50%" onError={(e) => e.target.style.display = 'none'} />
                ) : null}
                <div className="detail-container">
                    <MarkdownRenderer content={announcements.content} />
                </div>
                <div>
                    {announcements.files && announcements.files.length > 0 && (
                        <div className="attached-files">
                            <h3>Прикрепленные файлы:</h3>
                            <ul>
                                {announcements.files.map((file, index) => (
                                    <div key={index}>
                                        <DownloadFile file={file} />
                                    </div>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="fixed-buttons-container">
                    <Link to="/announcements" className="back-link">Назад к объявлениям</Link>
                    {announcements && announcements.canEdit && (
                        <>
                            <Link to={`/announcements/edit/${announcements.id}`} className="edit-button">
                                Редактировать
                            </Link>
                            <button
                                onClick={() => deleteAnnouncements(announcements.id)}
                                className="delete-button"
                            >
                                Удалить новость
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsDetail;
