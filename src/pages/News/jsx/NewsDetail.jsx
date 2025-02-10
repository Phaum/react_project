import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate  } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import "../css/NewsDetail.css";
import { Card, Typography, Button, Space, Image, List } from "antd";
import {EditOutlined, DeleteOutlined, ArrowLeftOutlined, FileOutlined} from "@ant-design/icons";
import {baseBackendUrl} from "../../../shared/constants"

const { Title, Paragraph } = Typography;

const NewsDetail = () => {
    const { id } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        const fetchNewsDetail = async () => {
            const token = getToken();
            const endpoint = token
                ? `${baseBackendUrl}/news/read`
                : `${baseBackendUrl}/news/read_guest`;
            try {
                const response = await fetch(`${baseBackendUrl}/news/${id}`, {
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
                setNews(data);
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
            const response = await fetch(`${baseBackendUrl}/news/${id}`, {
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
        <Card title={<Title level={3}>{<MarkdownRenderer content={news.title}/>}</Title>} style={{ maxWidth: 800, margin: "auto" }}>
            {news.image && (
                <img
                    src={news.image}
                    alt={news.title}
                    style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 16 }}
                    onError={(e) => e.target.style.display = "none"}
                />
            )}
            <Paragraph><MarkdownRenderer content={news.content} /></Paragraph>
            {news.files && news.files.length > 0 && (
                <Card title="Прикрепленные файлы" style={{ marginTop: 16 }}>
                    <List
                        dataSource={news.files}
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
                    <Link to="/news">Назад</Link>
                </Button>
                {news.canEdit && (
                    <>
                        <Button icon={<EditOutlined />} type="primary">
                            <Link to={`/news/edit/${news.id}`}>Редактировать</Link>
                        </Button>

                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => deleteNews(news.id)}
                        >
                            Удалить
                        </Button>
                    </>
                )}
            </Space>
        </Card>
    );
};

export default NewsDetail;
