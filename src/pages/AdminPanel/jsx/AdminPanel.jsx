import React, { useEffect, useState } from "react";
import { Table, Input, Select, Button, Form, Popconfirm, message, Modal } from "antd";
const { Option } = Select;

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const [group, setGroup] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const token = localStorage.getItem("token");

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
            setGroups(updatedGroups.groups);
            setNewGroupName("");
        } catch (err) {
            alert(err.message);
        }
    };

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
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error}</p>;

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const userColumns = [
        { title: "ID", dataIndex: "id", key: "id" },
        {
            title: "Имя пользователя",
            dataIndex: "username",
            key: "username",
            sorter: (a, b) => a.group.localeCompare(b.group),
            render: (text, record) => (
                <Input
                    value={text}
                    onChange={(e) =>
                        setUsers((prev) =>
                            prev.map((u) =>
                                u.id === record.id ? { ...u, username: e.target.value } : u
                            )
                        )
                    }
                />
            ),
        },
        {
            title: "Роль",
            dataIndex: "role",
            key: "role",
            sorter: (a, b) => a.group.localeCompare(b.group),
            render: (text, record) => (
                <Select
                    value={text}
                    onChange={(value) =>
                        setUsers((prev) =>
                            prev.map((u) => (u.id === record.id ? { ...u, role: value } : u))
                        )
                    }
                    style={{ width: 120 }}
                >
                    <Option value="admin">Админ</Option>
                    <Option value="teacher">Учитель</Option>
                    <Option value="student">Студент</Option>
                    <Option value="user">Пользователь</Option>
                </Select>
            ),
        },
        {
            title: "Группа",
            dataIndex: "group",
            key: "group",
            sorter: (a, b) => a.group.localeCompare(b.group),
            render: (text, record) => (
                <Select value={text} onChange={(value) => updateUserGroup(record.id, value)} style={{ width: 120 }}>
                    {groups.map((group) => (
                        <Option key={group} value={group}>
                            {group}
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <>
                    <Button onClick={() => resetPassword(record.id)} style={{ marginRight: 8 }}>
                        Изменить пароль
                    </Button>
                    <Button type="primary" onClick={() => updateUser(record.id, record)} style={{ marginRight: 8 }}>
                        Сохранить
                    </Button>
                    <Popconfirm title="Удалить пользователя?" onConfirm={() => deleteUser(record.id)}>
                        <Button danger>Удалить</Button>
                    </Popconfirm>
                </>
            ),
        },
    ];

    const groupColumns = [
        { title: "ID", dataIndex: "id", key: "id", render: (_, __, index) => index + 1 },
        { title: "Название", dataIndex: "name", key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: "Действие",
            key: "actions",
            render: (_, record) => (
                <Popconfirm title="Удалить группу?" onConfirm={() => deleteGroup(record.name)}>
                    <Button danger>Удалить</Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <h1>Администратор: управление пользователями</h1>
            <Table columns={userColumns} dataSource={users} rowKey="id" pagination={{ pageSize: 5 }} />
            <h2>Добавить новую группу</h2>
            <Input
                placeholder="Введите название группы"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{ width: 200, marginRight: 10 }}
            />
            <Button type="primary" onClick={addNewGroup}>
                Добавить группу
            </Button>
            <Table
                columns={groupColumns}
                dataSource={groups.map((name) => ({ name }))}
                rowKey="name"
                pagination={false}
                style={{ marginTop: 20 }}
            />
            <Button type="primary" onClick={showModal} style={{ marginTop: 20 }}>
                Добавить пользователя
            </Button>
            <Modal title="Добавить пользователя" open={isModalOpen} onCancel={handleCancel} footer={null}>
                <Form layout="vertical" form={form} onFinish={handleCreateUser}>
                    <Form.Item label="Имя пользователя" name="username" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Пароль" name="password" rules={[{ required: true }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
                        <Select>
                            <Option value="user">Пользователь</Option>
                            <Option value="student">Студент</Option>
                            <Option value="teacher">Учитель</Option>
                            <Option value="admin">Администратор</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Группа" name="group" rules={[{ required: true }]}>
                        <Select>
                            {groups.map((g) => (
                                <Option key={g} value={g}>
                                    {g}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Button type="primary" htmlType="submit">
                        Создать
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminPanel;
