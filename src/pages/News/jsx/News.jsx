import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/News.css";
import MarkdownRenderer from "../../../UI/MarkdownRenderer";

const News = () => {
    const [newsList, setNewsList] = useState([]); // Список новостей
    const [role, setRole] = useState("guest"); // Роль текущего пользователя (по умолчанию - гость)
    const [loading, setLoading] = useState(true); // Состояние загрузки
    const [error, setError] = useState(null); // Ошибки при загрузке новостей
    const navigate = useNavigate(); // Для перенаправления после сохранения
    // Функция для получения токена
    const getToken = () => localStorage.getItem("token");
    // Функция для загрузки новостей
    const fetchNews = async () => {
        const token = getToken();
        const endpoint = token
            ? "http://localhost:5000/news/read"
            : "http://localhost:5000/news/read_guest";
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
                setNewsList(data);
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
            navigate("/registration");
        } finally {
            setLoading(false);
        }
    };

    // Функция для удаления новости
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
                setNewsList((prevNews) => prevNews.filter((news) => news.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить новость: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении новости");
        }
    };

    useEffect(() => {
        fetchNews(); // Загружаем новости при монтировании компонента
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
            <h1>Новости</h1>
            {(role === "teacher" || role === "admin") && (
                <div className="news-container">
                    <Link to="/create_news" className="create-news-button">
                        Создать новость
                    </Link>
                </div>
            )}
            {newsList.length > 0 ? (
                newsList.map((news) => (
                    <div className="news-container" key={news.id}>
                        <div className="text-block">
                            <h2>
                                <Link to={`/news/${news.id}`} className="view-news-button">
                                    <MarkdownRenderer content={news.title}/>
                                </Link>
                            </h2>
                        </div>
                        {(role === "teacher" || role === "admin") && (
                            <div className="text-block">
                                <h2>
                                    <Link to={`/news/edit/${news.id}`} className="edit-button">
                                        Редактировать
                                    </Link>
                                </h2>
                                <button
                                    onClick={() => deleteNews(news.id)}
                                    className="delete-button"
                                >
                                    Удалить новость
                                </button>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p>Пока нет новостей</p>
            )}
        </div>
    );
};

export default News;
