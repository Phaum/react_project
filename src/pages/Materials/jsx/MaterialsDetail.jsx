import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate  } from "react-router-dom";
import MarkdownRenderer from "../../../UI/MarkdownRenderer";
import DownloadFile from "../../../UI/DownloadFile";
import "../css/MaterialsDetail.css";

const MaterialsDetail = () => {
    const { id } = useParams(); // Получаем ID из параметров маршрута
    const [materials, setMaterials] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate(); // Хук для навигации
    const [articles, setArticles] = useState([]);

    // Функция для получения токена
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        // Функция для загрузки данных о конкретной новости
        const fetchMaterialsDetail = async () => {
            const token = getToken();
            const endpoint = token
                ? "http://localhost:5000/materials/read"
                : "http://localhost:5000/materials/read_guest";
            try {
                const response = await fetch(`http://localhost:5000/materials/${id}`, {
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
                setMaterials(data); // Сохраняем данные о новости
                console.log("Пришедшие данные новости:", data); // 🔍 Логируем ответ
            } catch (error) {
                console.error("Ошибка при загрузке новости:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        // функция для отображения статей
        const fetchArticles = async () => {
            try {
                const response = await fetch(`http://localhost:5000/materials/${id}/articles`);
                if (!response.ok) throw new Error("Ошибка загрузки статей");
                const data = await response.json();
                setArticles(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchMaterialsDetail();
        fetchArticles();
    }, [id]);

    const deleteMaterials = async (id) => {
        const token = getToken();
        try {
            const response = await fetch(`http://localhost:5000/materials/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                alert("Материал успешно удален");
                navigate("/materials");
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить материал: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении материала");
        }
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>Ошибка: {error}</p>;
    }

    if (!materials) {
        return <p>Новость не найдена.</p>;
    }

    return (
        <div className="main-container">
            <div>
                <MarkdownRenderer content={materials.title}/>
                {materials.image ? (
                    <img className="materials-container" src={materials.image} alt={materials.title} width="50%" onError={(e) => e.target.style.display = 'none'} />
                ) : null}
                <div className="detail-container">
                    <MarkdownRenderer content={materials.content} />
                </div>

                <div>
                    {articles.length > 0 ? (
                        <div >
                            {articles.map((article) => (
                                <div key={article.id} className="detail-container">
                                    <Link to={`/materials/${id}/articles/${article.id}`}>
                                        <MarkdownRenderer content={article.title}/>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Разделы отсутствуют</p>
                    )}
                </div>
                <div className="detail-container">
                    {materials.files && materials.files.length > 0 && (
                        <div className="attached-files">
                            <h3>Прикрепленные файлы:</h3>
                            <ul>
                                {materials.files.map((file, index) => (
                                    <div key={index}>
                                        <DownloadFile file={file} />
                                    </div>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="fixed-buttons-container">
                    <Link to="/materials" className="back-link">Назад к материалам</Link>
                    {(role === "teacher" || role === "admin") && (
                        <>
                            <Link to={`/materials/edit/${materials.id}`} className="edit-button">
                                Редактировать
                            </Link>
                            <button
                                onClick={() => deleteMaterials(materials.id)}
                                className="delete-button"
                            >
                                Удалить материал
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialsDetail;
