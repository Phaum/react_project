import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Typography, Button, Space } from "antd";
import { LogoutOutlined, ToolOutlined, BookOutlined, DashboardOutlined } from "@ant-design/icons";
import {baseBackendUrl} from "../../shared/constants"

const { Title, Text, Link: AntLink } = Typography;

const Profile = () => {
    const [login, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [group, setGroup] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/registration');
                return;
            }
            try {
                const response = await fetch(`${baseBackendUrl}/registration/verify`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.login);
                    setRole(data.role);
                    setGroup(data.group);
                } else {
                    localStorage.removeItem('token');
                    navigate('/registration');
                }
            } catch (error) {
                console.error("Ошибка проверки токена:", error);
                localStorage.removeItem('token');
                navigate('/registration');
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/registration');
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    return (
        <Card style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
            <Title level={2}>Профиль</Title>
            <Text strong>Добро пожаловать, {login}</Text>
            <br />
            <Text strong>Ваша роль:{" "}
                {role === "admin" ? "Администратор" :
                    role === "teacher" ? "Ментор" :
                        role === "student" ? "Студент" : "Гость"}
            </Text>
            <br />
            <Text strong>Ваша группа: {group}</Text>
            <br />
            <Space direction="vertical" style={{ marginTop: 16 }}>
                {role === "admin" && (
                    <>
                        <Link to="/admin-tools">
                            <Button type="primary" icon={<DashboardOutlined />}>Панель администратора</Button>
                        </Link>
                        <Link to="/mentor-tools">
                            <Button type="default" icon={<ToolOutlined />}>Инструменты ментора</Button>
                        </Link>
                    </>
                )}
                {role === "teacher" && (
                    <Link to="/mentor-tools">
                        <Button type="default" icon={<ToolOutlined />}>Инструменты ментора</Button>
                    </Link>
                )}
                {role === "student" && group !== "none" && (
                    <Link to="/materials">
                        <Button type="default" icon={<BookOutlined />}>
                            Материалы для группы {group}
                        </Button>
                    </Link>
                )}
                <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{ marginTop: 20 }}
                >
                    Выйти
                </Button>
            </Space>
        </Card>
    );
};

export default Profile;
