import React, { useEffect, useState } from "react";
import { Select, Space, Input } from "antd";

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newGroupName, setNewGroupName] = useState("");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user"); // По умолчанию "user"
    const [group, setGroup] = useState(""); // Выбранная группа

    const token = localStorage.getItem("token");

    // Загрузка пользователей и групп с сервера
    useEffect(() => {
        const fetchUsersAndGroups = async () => {
            try {
                const token = localStorage.getItem("token");
                const [usersResponse, groupsResponse] = await Promise.all([
                    fetch("http://localhost:5000/admin-tools", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("http://localhost:5000/admin-tools/groups", { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (!usersResponse.ok || !groupsResponse.ok) {
                    throw new Error("Ошибка при загрузке данных");
                }
                const usersData = await usersResponse.json();
                const groupsData = await groupsResponse.json();
                setUsers(usersData);
                setGroups(groupsData);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsersAndGroups();
    }, [token]);

    // Удаление пользователя
    const deleteUser = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/admin-tools/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error("Ошибка при удалении пользователя");
            }
            setUsers(users.filter((user) => user.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    // Обновление пользователя (Имя, Роль, Группа)
    const updateUser = async (id, updatedUser) => {
        try {
            const response = await fetch(`http://localhost:5000/admin-tools/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedUser),
            });
            if (!response.ok) {
                throw new Error("Ошибка при обновлении пользователя");
            }
            setUsers(users.map((user) => (user.id === id ? updatedUser : user)));
            alert(`Пользователь ${updatedUser.username} успешно обновлен!`);
        } catch (err) {
            alert(err.message);
        }
    };

    // Изменение группы пользователя
    const updateUserGroup = async (id, newGroup) => {
        try {
            const response = await fetch(`http://localhost:5000/admin-tools/${id}/group`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newGroup }),
            });
            if (!response.ok) {
                throw new Error("Ошибка при изменении группы");
            }
            setUsers(users.map((user) => (user.id === id ? { ...user, group: newGroup } : user)));
        } catch (err) {
            alert(err.message);
        }
    };

    // Функция для сброса пароля
    const resetPassword = async (id) => {
        const newPassword = prompt("Введите новый пароль (мин. 6 символов):");
        if (!newPassword || newPassword.length < 6) {
            alert("Пароль должен содержать минимум 6 символов!");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/admin-tools/${id}/reset-password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newPassword }),
            });
            if (!response.ok) {
                throw new Error("Ошибка при изменении пароля");
            }
            alert("Пароль успешно изменен!");
        } catch (err) {
            alert(err.message);
        }
    };

    // Добавление новой группы
    const addNewGroup = async () => {
        if (!newGroupName.trim()) {
            alert("Название группы не может быть пустым!");
            return;
        }
        try {
            const response = await fetch("http://localhost:5000/admin-tools/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newGroup: newGroupName }),
            });
            if (!response.ok) {
                throw new Error("Ошибка при добавлении группы");
            }
            const updatedGroups = await response.json();
            setGroups(updatedGroups.groups); // Обновляем список групп
            setNewGroupName("");
            alert("Группа успешно добавлена!");
        } catch (err) {
            alert(err.message);
        }
    };

    // Функция создания нового пользователя
    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            alert("Пароль должен быть минимум 6 символов!");
            return;
        }
        if (!group) {
            alert("Выберите группу!");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/admin-tools/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username, password, role, group }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }
            const data = await response.json();
            alert("Пользователь успешно создан!");
            window.location.reload();
            setUsername("");
            setPassword("");
            setRole("user");
            setGroup("");
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    };

    // Удаление группы
    const deleteGroup = async (groupName) => {
        const usersInGroup = users.some((user) => user.group === groupName);
        if (usersInGroup) {
            alert("Нельзя удалить группу, в которой есть пользователи!");
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/admin-tools/groups/${groupName}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Ошибка при удалении группы");
            }
            setGroups(groups.filter((group) => group !== groupName));
            alert("Группа успешно удалена!");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error}</p>;
    return (
        <div>
            <h1>Администратор: управление пользователями</h1>
            <table border="1">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Роль</th>
                    <th>Группа</th>
                    <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                            <Input placeholder="Имя пользователя"
                                   type="text"
                                   value={user.username}
                                   onChange={(e) =>
                                       setUsers((prev) =>
                                           prev.map((u) =>
                                               u.id === user.id
                                                   ? { ...u, username: e.target.value }
                                                   : u
                                           )
                                       )
                                   }
                            />
                        </td>
                        <td>
                            <select
                                value={user.role}
                                onChange={(e) =>
                                    setUsers((prev) =>
                                        prev.map((u) =>
                                            u.id === user.id
                                                ? { ...u, role: e.target.value }
                                                : u
                                        )
                                    )
                                }
                            >
                                <option value="admin">Админ</option>
                                <option value="teacher">Учитель</option>
                                <option value="student">Студент</option>
                                <option value="user">Пользователь</option>
                            </select>
                        </td>
                        <td>
                            <select
                                value={user.group}
                                onChange={(e) => updateUserGroup(user.id, e.target.value)}
                            >
                                {groups.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <button onClick={() => resetPassword(user.id)}>Изменить пароль</button>
                            <button onClick={() => updateUser(user.id, user)}>Сохранить</button>
                            <button onClick={() => deleteUser(user.id)}>Удалить</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <h2>Добавить новую группу</h2>
            <div>
                <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Введите название группы"
                />
                <button onClick={addNewGroup}>Добавить группу</button>
            </div>
            <table border="1">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Действие</th>
                </tr>
                </thead>
                <tbody>
                {groups.map((group, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{group}</td>
                        <td>
                            <button onClick={() => deleteGroup(group)}>Удалить</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div>
                <h2>Добавить пользователя</h2>
                <form onSubmit={handleCreateUser}>
                    <div>
                            <label>Имя пользователя:</label>
                            <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Пароль:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Роль:</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="user">Пользователь</option>
                            <option value="student">Студент</option>
                            <option value="teacher">Учитель</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div>
                        <label>Группа:</label>
                        <select value={group} onChange={(e) => setGroup(e.target.value)} required>
                            <option value="">Выберите группу</option>
                            {groups.map((g) => (
                                <option key={g} value={g}>
                                    {g}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit">Создать пользователя</button>
                </form>
            </div>
        </div>
    );
};

export default AdminPanel;
