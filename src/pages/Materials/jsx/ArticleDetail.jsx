import React, { useEffect, useState } from "react";
import {Link, useParams, useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../../UI/MarkdownRenderer";
import DownloadFile from "../../../UI/DownloadFile";

const ArticleDetail = () => {
    const { id, articleId } = useParams(); // Получаем ID материала и статьи
    const [article, setArticle] = useState(null);
    const [role, setRole] = useState("guest");
    const [articles, setArticles] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Ошибка загрузки статьи");
                const data = await response.json();
                if (token) {
                    const storedRole = localStorage.getItem("role");
                    setRole(storedRole || "guest");
                }
                setArticle(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchArticle();
    }, [id, articleId]);

    // Функция для удаления статьи
    const deleteArticle = async (e, articleId) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setArticles(articles.filter((article) => article.id !== articleId));
                navigate(`/materials/edit/${id}`); // Перенаправляем назад к материалам
            } else {
                alert("Ошибка при удалении статьи");
            }
        } catch (error) {
            console.error("Ошибка при удалении статьи", error);
        }
    };

    // Если ошибка, выводим сообщение
    if (error) return <p>Ошибка: {error}</p>;

    // Если article === null, выводим заглушку
    if (!article) return <p>Статья не найдена</p>;

    return (
        <div className="main-container">
            <div>
                <MarkdownRenderer content={article.title}/>
                {article.image ? (
                    <img className="news-container" src={article.image} alt={article.title} width="50%" onError={(e) => e.target.style.display = 'none'} />
                ) : null}
                <div className="detail-container">
                    <MarkdownRenderer content={article.content} />
                </div>
                <div>
                    {article.files && article.files.length > 0 && (
                        <div className="detail-container">
                            <h3>Прикрепленные файлы:</h3>
                            <ul>
                                {article.files.map((file, index) => (
                                    <div key={index}>
                                        <DownloadFile file={file} />
                                    </div>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="fixed-buttons-container">
                    <Link to={`/materials/${id}`} className="back-link">Назад к материалу</Link>
                    {(role === "teacher" || role === "admin") && (
                        <>
                            <Link to={`/materials/${id}/articles/${article.id}/edit`} className="edit-button">
                                Редактировать
                            </Link>
                            <button
                                onClick={(e) => deleteArticle(e,article.id)}
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

export default ArticleDetail;
