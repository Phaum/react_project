import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate  } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import "../css/NewsDetail.css";


const NewsDetail = () => {
    const { id } = useParams(); // Получаем ID из параметров маршрута
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate(); // Хук для навигации

    // Функция для получения токена
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        // Функция для загрузки данных о конкретной новости
        const fetchNewsDetail = async () => {
            const token = getToken();
            const endpoint = token
                ? "http://localhost:5000/news/read"
                : "http://localhost:5000/news/read_guest";
            try {
                const response = await fetch(`http://localhost:5000/news/${id}`, {
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
                setNews(data); // Сохраняем данные о новости
                // console.log("Пришедшие данные новости:", data); // 🔍 Логируем ответ
            } catch (error) {
                console.error("Ошибка при загрузке новости:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchNewsDetail();
    }, [id]);

    const deleteNews = async (id) => {
        const token = getToken();
        try {
            const response = await fetch(`http://localhost:5000/news/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                alert("Новость успешно удалена");
                navigate("/news");
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить новость: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении новости");
        }
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>Ошибка: {error}</p>;
    }

    if (!news) {
        return <p>Новость не найдена.</p>;
    }

    return (
        <div className="main-container">
            <div>
                <div><MarkdownRenderer content={news.title}/></div>
                {news.image ? (
                    <img className="news-container" src={news.image} alt={news.title} width="50%" onError={(e) => e.target.style.display = 'none'} />
                ) : null}
                <div className="detail-container">
                    <MarkdownRenderer content={news.content} />
                </div>
                <div>
                    {news.files && news.files.length > 0 && (
                        <div className="attached-files">
                            <h3>Прикрепленные файлы:</h3>
                            <ul>
                                {news.files.map((file, index) => (
                                    <div key={index}>
                                        <DownloadFile file={file} />
                                    </div>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="fixed-buttons-container">
                    <Link to="/news" className="back-link">Назад к новостям</Link>
                    {news && news.canEdit && (
                        <>
                            <Link to={`/news/edit/${news.id}`} className="edit-button">
                                Редактировать
                            </Link>
                            <button
                                onClick={() => deleteNews(news.id)}
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

export default NewsDetail;
