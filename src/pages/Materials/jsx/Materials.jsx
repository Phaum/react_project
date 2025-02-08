import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Materials.css";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";

const Materials = () => {
    const [materialsList, setMaterialsList] = useState([]); // Список новостей
    const [loading, setLoading] = useState(true); // Состояние загрузки
    const [error, setError] = useState(null); // Ошибки при загрузке новостей
    const [role, setRole] = useState("guest");
    const navigate = useNavigate(); // Для перенаправления после сохранения

    // Функция для получения токена
    const getToken = () => localStorage.getItem("token");

    // Функция для загрузки новостей
    const fetchMaterials = async () => {
        const token = getToken();
        const endpoint = token
            ? "http://localhost:5000/materials/read"
            : "http://localhost:5000/materials/read_guest";
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
                setMaterialsList(data);
                // if (token) {
                //     const storedRole = localStorage.getItem("role");
                //     setRole(storedRole || "guest");
                // }
            } else {
                const errorMessage = await response.text();
                setError(`Ошибка при загрузке материалов: ${errorMessage}`);
                navigate("/registration");
            }
        } catch (error) {
            setError("Произошла ошибка при загрузке материалов");
        } finally {
            setLoading(false);
        }
    };

    // Функция для удаления новости
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
                alert("Новость успешно удалена");
                setMaterialsList((prevMaterials) => prevMaterials.filter((materials) => materials.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить новость: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении материала");
        }
    };

    useEffect(() => {
        fetchMaterials(); // Загружаем новости при монтировании компонента
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
            <h1>Учебные материалы</h1>
            {(role === "teacher" || role === "admin") && (
                        <div className="materials-container">
                            <Link to="/create_materials" className="create-materials-button">
                                Создать материал
                            </Link>
                        </div>
                    )}
            {materialsList.length > 0 ? (
                materialsList.map((materials) => (
                    <div className="materials-container" key={materials.id}>
                        <div className="text-block">
                            <h2>
                                <Link to={`/materials/${materials.id}`} className="view-materials-button">
                                    <MarkdownRenderer content={materials.title}/>
                                </Link>
                            </h2>
                        </div>
                        {materials.canEdit && (
                            <div className="text-block">
                                <h2>
                                    <Link to={`/materials/edit/${materials.id}`} className="edit-button">
                                        Редактировать
                                    </Link>
                                </h2>
                                <button
                                    onClick={() => deleteMaterials(materials.id)}
                                    className="delete-button"
                                >
                                    Удалить новость
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

export default Materials;
