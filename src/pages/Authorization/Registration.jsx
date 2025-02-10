import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Alert } from "antd";
import {baseBackendUrl} from "../../shared/constants"

const { Title, Text, Link } = Typography;

const AuthPage = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            verifyToken(token);
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            const response = await fetch(`${baseBackendUrl}/registration/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                navigate('/profile');
            } else {
                localStorage.removeItem('token');
            }
        } catch (err) {
            console.error("Ошибка проверки токена:", err);
        }
    };

    const handleSubmit = async (values) => {
        try {
            const endpoint = isRegister
                ? `${baseBackendUrl}/registration/register`
                : `${baseBackendUrl}/registration/login`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                const data = await response.json();
                if (isRegister) {
                    alert("Регистрация успешна! Теперь вы можете войти.");
                    setIsRegister(false);
                } else {
                    localStorage.setItem("token", data.token);
                    navigate("/profile");
                }
            } else {
                const errorMessage = await response.text();
                try {
                    const errorData = JSON.parse(errorMessage);
                    setError(errorData.message || "Ошибка аутентификации");
                } catch {
                    setError(errorMessage);
                }
            }
        } catch (err) {
            setError("Произошла ошибка. Попробуйте ещё раз.");
            console.error(err);
        }
    };

    return (
        <Card style={{ maxWidth: 400, margin: "0 auto", padding: 20, textAlign: "center" }}>
            <Title level={2}>{isRegister ? "Регистрация" : "Вход"}</Title>

            <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label="Имя пользователя"
                    name="username"
                    rules={[{ required: true, message: "Введите имя пользователя!" }]}
                >
                    <Input placeholder="Введите имя" />
                </Form.Item>

                <Form.Item
                    label="Пароль"
                    name="password"
                    rules={[{ required: true, message: "Введите пароль!" }]}
                >
                    <Input.Password placeholder="Введите пароль" />
                </Form.Item>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 10 }} />}

                <Button type="primary" htmlType="submit" block>
                    {isRegister ? "Зарегистрироваться" : "Войти"}
                </Button>
            </Form>

            <Text>
                {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
                <Link onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? "Войти" : "Зарегистрироваться"}
                </Link>
            </Text>
        </Card>
    );
};

export default AuthPage;
