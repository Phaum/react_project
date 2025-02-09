import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Materials.css";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import { Card, Button, Typography, List, Space } from "antd";
const { Title } = Typography;

const Materials = () => {
    const [materialsList, setMaterialsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("token");

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
                alert(`Не удалось удалить материал: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении материала");
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const formattedDate = (date) => {
        const validDate = new Date(date);
        return validDate.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div style={{ padding: 20 }}>
            <Title level={2}>Материалы</Title>
            {materialsList.some((materials) => materials.canEdit) && (
                <div style={{ marginBottom: 16 }}>
                    <Link to="/create_materials">
                        <Button type="primary">Создать материал</Button>
                    </Link>
                </div>
            )}
            {materialsList.length > 0 ? (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={materialsList}
                    renderItem={(materials) => (
                        <List.Item>
                            <Card
                                title={<Link to={`/materials/${materials.id}`}><MarkdownRenderer content={materials.title}/></Link>}
                                bordered
                                extra={materials.canEdit && (
                                    <Space>
                                        <Link to={`/materials/edit/${materials.id}`}>
                                            <Button type="primary">Редактировать</Button>
                                        </Link>
                                        <Button danger onClick={() => deleteMaterials(materials.id)}>
                                            Удалить
                                        </Button>
                                    </Space>
                                )}
                            >
                                <p>{`Дата публикации: ${formattedDate(materials.id)}` || "Описание материалы отсутствует"}</p>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <p>Пока нет материалов</p>
            )}
        </div>
    );
};

export default Materials;
