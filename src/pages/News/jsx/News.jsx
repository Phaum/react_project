import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/News.css";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import { Card, Button, Typography, List, Space } from "antd";
import {baseBackendUrl} from "../../../shared/constants"

const { Title } = Typography;

const News = () => {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("token");
    const fetchNews = async () => {
        const token = getToken();
        const endpoint = token
            ? `${baseBackendUrl}/news/read`
            : `${baseBackendUrl}/news/read_guest`;
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
                setNewsList((prevNews) => prevNews.filter((news) => news.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Не удалось удалить новость: ${errorMessage}`);
            }
        } catch (error) {
            alert("Произошла ошибка при удалении новости");
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
        fetchNews();
    }, []);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div style={{ padding: 20 }}>
            <Title level={2}>Новости</Title>
            {newsList.some((news) => news.canEdit) && (
                <div style={{ marginBottom: 16 }}>
                    <Link to="/create_news">
                        <Button type="primary">Создать новость</Button>
                    </Link>
                </div>
            )}
            {newsList.length > 0 ? (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={newsList}
                    renderItem={(news) => (
                        <List.Item>
                            <Card
                                title={<Link to={`/news/${news.id}`}><MarkdownRenderer content={news.title}/></Link>}
                                bordered
                            >
                            <p>{`Дата публикации: ${formattedDate(news.id)}` || "Описание новости отсутствует"}</p>
                            {news.canEdit && (
                            <>
                                <Link to={`/news/edit/${news.id}`}>
                                    <Button type="primary" >
                                        Редактировать
                                    </Button>
                                </Link>
                                <Button danger onClick={() => deleteNews(news.id)}>
                                    Удалить
                                </Button>
                            </>
                            )}
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <p>Пока нет новостей</p>
            )}
        </div>
    );
};

export default News;
