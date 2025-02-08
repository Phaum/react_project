import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [group, setGroup] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                // Если токена нет, перенаправляем на страницу авторизации
                navigate('/registration');
                return;
            }
            try {
                const response = await fetch("http://localhost:5000/registration/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json(); // Получаем данные из токена
                    setUsername(data.username);
                    setRole(data.role);
                    setGroup(data.group);
                } else {
                    // Если токен недействителен, удаляем его и перенаправляем
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
        // Удаляем токен, имя пользователя и роль из localStorage
        localStorage.removeItem('token');
        navigate('/registration'); // Перенаправляем на страницу авторизации
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    const roles = {
        "admin": "Администратор",
        "teacher": "Преподаватель",
        "student": "Студент",
    }


    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <h1>Профиль</h1>
            <p>Добро пожаловать {username}</p>
            <p>Ваша роль: {roles[role] || "Студент"}.</p>
            <p>Ваша группа: {group}</p>
            {role === 'admin' && (
                <div>
                    <p>
                        <Link to="/admin-tools" style={{ textDecoration: 'none', color: 'blue' }}>
                            Перейти в панель администратора
                        </Link>
                    </p>
                    <p>
                        <Link to="/teacher-tools" style={{ textDecoration: 'none', color: 'blue' }}>
                            Инструменты преподавателя
                        </Link>
                    </p>
                </div>
            )}
            {role === 'teacher' && (
                <div>
                    <Link to="/teacher-tools" style={{ textDecoration: 'none', color: 'blue' }}>
                        Инструменты преподавателя
                    </Link>
                </div>
            )}
            {role === 'student' && group !== 'none' && (
                <div>
                    <Link to="/materials" style={{ textDecoration: 'none', color: 'blue' }}>
                        Доступные материалы для студентов группы {group}
                    </Link>
                </div>
            )}
            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ff4d4d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Выйти
                </button>
            </div>
        </div>
    );
};

export default Profile;
