import React, { useEffect, useState } from "react";
import {Link, useParams, useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import { Card, Typography, List, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, FileOutlined } from "@ant-design/icons";
import {baseBackendUrl} from "../../../shared/constants"

const { Title, Paragraph } = Typography;

const ArticleDetail = () => {
    const { id, articleId } = useParams();
    const [article, setArticle] = useState(null);
    const [role, setRole] = useState("guest");
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${baseBackendUrl}/materials/${id}/articles/${articleId}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Ошибка загрузки статьи");
                const data = await response.json();
                setArticle(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchArticle();
    }, [id, articleId]);

    const deleteArticle = async (e, articleId) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${baseBackendUrl}/materials/${id}/articles/${articleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setArticles(articles.filter((article) => article.id !== articleId));
                navigate(`/materials/edit/${id}`);
            } else {
                alert("Ошибка при удалении статьи");
            }
        } catch (error) {
            console.error("Ошибка при удалении статьи", error);
        }
    };

    if (error) return <p>Ошибка: {error}</p>;

    if (!article) return <p>Статья не найдена</p>;

    return (
        <Card title={<Title level={3}>{<MarkdownRenderer content={article.title}/>}</Title>} style={{ maxWidth: 800, margin: "auto" }}>
            {article.image && (
                <img
                    src={article.image}
                    alt={article.title}
                    style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 16 }}
                    onError={(e) => e.target.style.display = "none"}
                />
            )}
            <Paragraph><MarkdownRenderer content={article.content} /></Paragraph>
            {article.files && article.files.length > 0 && (
                <Card title="Прикрепленные файлы" style={{ marginTop: 16 }}>
                    <List
                        dataSource={article.files}
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
                    <Link to={`/materials/${id}`}>Назад</Link>
                </Button>
                {article.canEdit && (
                    <>
                        <Button icon={<EditOutlined />} type="primary">
                            <Link to={`/materials/${id}/articles/${article.id}/edit`}>Редактировать</Link>
                        </Button>

                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => deleteArticle(article.id)}
                        >
                            Удалить
                        </Button>
                    </>
                )}
            </Space>
        </Card>
    );
};

export default ArticleDetail;
