import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Announcements.css";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import { List, Card, Typography, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
const { Title, Paragraph } = Typography;

const Announcements = () => {
    const [announcementsList, setAnnouncementsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("token");

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
                setError(`Ошибка при загрузке объявлений: ${errorMessage}`);
                navigate("/registration");
            }
        } catch (error) {
            setError("Произошла ошибка при загрузке объявлений");
        } finally {
            setLoading(false);
        }
    };

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
                alert("Объявление успешно удалена");
                setAnnouncementsList((prevAnnouncements) => prevAnnouncements.filter((announcements) => announcements.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить объявление: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении объявления");
        }
    };

    const formattedDate = (date) => {
        const validDate = new Date(date);
        return validDate.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div style={{ padding: 20 }}>
            <Title level={2}>Объявления</Title>
            {announcementsList.some((announcements) => announcements.canEdit) && (
                <div style={{ marginBottom: 16 }}>
                    <Link to="/create_announcements">
                        <Button type="primary">Создать объявление</Button>
                    </Link>
                </div>
            )}
            {announcementsList.length > 0 ? (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={announcementsList}
                    renderItem={(announcements) => (
                        <List.Item>
                            <Card
                                title={<Link to={`/announcements/${announcements.id}`}><MarkdownRenderer content={announcements.title}/></Link>}
                                bordered
                                extra={announcements.canEdit && (
                                    <Space>
                                        <Link to={`/announcements/edit/${announcements.id}`}>
                                            <Button type="primary">Редактировать</Button>
                                        </Link>
                                        <Button danger onClick={() => deleteAnnouncements(announcements.id)}>
                                            Удалить
                                        </Button>
                                    </Space>
                                )}
                            >
                                <p>{`Дата публикации: ${formattedDate(announcements.id)}` || "Описание объявления отсутствует"}</p>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <p>Пока нет объявлений</p>
            )}
        </div>
    );
};

export default Announcements;
