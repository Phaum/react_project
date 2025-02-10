import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate  } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import "../css/MaterialsDetail.css";
import { Card, Typography, List, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, FileOutlined } from "@ant-design/icons";
import {baseBackendUrl} from "../../../shared/constants"

const { Title } = Typography;

const MaterialsDetail = () => {
    const { id } = useParams();
    const [materials, setMaterials] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("guest");
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        const fetchMaterialsDetail = async () => {
            const token = getToken();
            const endpoint = token
                ? `${baseBackendUrl}/materials/read`
                : `${baseBackendUrl}/materials/read_guest`;
            try {
                const response = await fetch(`${baseBackendUrl}/materials/${id}`, {
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
                setMaterials(data);
            } catch (error) {
                console.error("Ошибка при загрузке новости:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchArticles = async () => {
            const token = getToken();
            try {
                const response = await fetch(`${baseBackendUrl}/materials/${id}/articles`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });
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
            const response = await fetch(`${baseBackendUrl}/materials/${id}`, {
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
        <div style={{ maxWidth: 800, margin: "auto" }}>
            <Title level={2}>{<MarkdownRenderer content={materials.title}/>}</Title>
            {materials.image && (
                <img
                    src={materials.image}
                    alt={materials.title}
                    style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 16 }}
                    onError={(e) => e.target.style.display = "none"}
                />
            )}
            <Card>
                <Typography.Paragraph>
                    {<MarkdownRenderer content={materials.content}/>}
                </Typography.Paragraph>
            </Card>
            {articles.length > 0 ? (
                <List
                    header={<Title level={4}>Разделы</Title>}
                    bordered
                    dataSource={articles}
                    renderItem={(article) => (
                        <List.Item>
                            <Link to={`/materials/${materials.id}/articles/${article.id}`}>
                                {<MarkdownRenderer content={article.title}/>}
                            </Link>
                        </List.Item>
                    )}
                    style={{ marginTop: 16 }}
                />
            ) : (
                <p style={{ marginTop: 16 }}>Разделы отсутствуют</p>
            )}
            {materials.files && materials.files.length > 0 && (
                <Card title="Прикрепленные файлы" style={{ marginTop: 16 }}>
                    <List
                        dataSource={materials.files}
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
                <Button type="default" icon={<ArrowLeftOutlined />}>
                    <Link to="/materials">Назад к материалам</Link>
                </Button>
                {materials.canEdit && (
                    <>
                        <Button type="primary" icon={<EditOutlined />}>
                            <Link to={`/materials/edit/${materials.id}`}>Редактировать</Link>
                        </Button>
                        <Button danger icon={<DeleteOutlined />} onClick={() => deleteMaterials(materials.id)}>
                            Удалить
                        </Button>
                    </>
                )}
            </Space>
        </div>
    );
};

export default MaterialsDetail;
