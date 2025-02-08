import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [isRegister, setIsRegister] = useState(false); // Переключатель между входом и регистрацией
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Проверка токена при загрузке страницы
        const token = localStorage.getItem('token');
        if (token) {
            verifyToken(token); // Проверяем токен на сервере
        }
    }, [navigate]);

    const verifyToken = async (token) => {
        try {
            const response = await fetch("http://localhost:5000/registration/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Токен подтвержден", data);
                // Токен валиден, перенаправляем на профиль
                navigate('/profile');
            } else {
                console.log("Ошибка подтверждения токена");
                // Если токен недействителен, очищаем localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
            }
        } catch (err) {
            console.error("Ошибка проверки токена:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isRegister
                ? "http://localhost:5000/registration/register"
                : "http://localhost:5000/registration/login";
            const body = JSON.stringify({ username, password });
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body,
            });
            if (response.ok) {
                const data = await response.json();
                if (isRegister) {
                    alert("Регистрация успешна! Теперь вы можете войти.");
                    setIsRegister(false); // Переключаемся на страницу входа
                } else {
                    // Сохраняем токен
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("role", data.role);
                    localStorage.setItem("username", data.username);
                    alert(`Добро пожаловать, ${data.username}!`);
                    navigate("/profile");
                }
            } else {
                const errorMessage = await response.text();
                try {
                    const errorData = JSON.parse(errorMessage);
                    setError(errorData.message || "Ошибка аутентификации");
                } catch (parseError) {
                    setError(errorMessage); // Если сервер вернул не JSON, просто выводим текст
                }
            }
        } catch (err) {
            setError("Произошла ошибка. Пожалуйста, попробуйте ещё раз.");
            console.error(err);
        }
    };


    return (
        <div className="main-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
            <h1>{isRegister ? 'Регистрация' : 'Вход'}</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Имя пользователя:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
            </form>
            <p>
                {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
                <button
                    onClick={() => {
                        setIsRegister(!isRegister);
                        setError(null); // Сбрасываем ошибку при переключении
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'blue',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                    }}
                >
                    {isRegister ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </p>
        </div>
    );
};

export default AuthPage;
