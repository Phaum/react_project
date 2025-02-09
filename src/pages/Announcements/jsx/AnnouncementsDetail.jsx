import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate  } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import "../css/AnnouncementsDetail.css";
import { Card, Typography, Button, Space, Image, List } from "antd";
import {DownloadOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, FileOutlined} from "@ant-design/icons";
const { Title, Paragraph } = Typography;

const AnnouncementsDetail = () => {
    const { id } = useParams();
    const [announcements, setAnnouncements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
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
                }
                setAnnouncements(data);
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
        <Card title={<Title level={3}>{<MarkdownRenderer content={announcements.title}/>}</Title>} style={{ maxWidth: 800, margin: "auto" }}>
            {announcements.image && (
                <img
                    src={announcements.image}
                    alt={announcements.title}
                    style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 16 }}
                    onError={(e) => e.target.style.display = "none"}
                />
            )}
            <Paragraph><MarkdownRenderer content={announcements.content} /></Paragraph>
            {announcements.files && announcements.files.length > 0 && (
                <Card title="Прикрепленные файлы" style={{ marginTop: 16 }}>
                    <List
                        dataSource={announcements.files}
                        renderItem={(file, index) => (
                            <List.Item key={index}>
                                <FileOutlined style={{ marginRight: 8 }} />
                                <DownloadFile file={file} />
                            </List.Item>
                        )}
                    />
                </Card>
            )}
            <Space style={{ marginTop: 16 }}>
                <Button icon={<ArrowLeftOutlined />} type="default">
                    <Link to="/announcements">Назад</Link>
                </Button>
                {announcements.canEdit && (
                    <>
                        <Button icon={<EditOutlined />} type="primary">
                            <Link to={`/announcements/edit/${announcements.id}`}>Редактировать</Link>
                        </Button>

                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => deleteAnnouncements(announcements.id)}
                        >
                            Удалить
                        </Button>
                    </>
                )}
            </Space>
        </Card>
    );
};

export default AnnouncementsDetail;
