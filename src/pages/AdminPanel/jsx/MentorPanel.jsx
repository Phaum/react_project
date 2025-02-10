import React, { useEffect, useState, useRef } from "react";
import { Table, Input, Select, Button, Form, Popconfirm, message, Modal } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import {baseBackendUrl} from "../../../shared/constants"

const { Option } = Select;

const MentorPanel = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const token = localStorage.getItem("token");

    const searchInput = useRef(null);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        const fetchUsersAndGroups = async () => {
            try {
                const token = localStorage.getItem("token");
                const [usersResponse, groupsResponse] = await Promise.all([
                    fetch(`${baseBackendUrl}/admin-tools`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${baseBackendUrl}/admin-tools/groups`, { headers: { Authorization: `Bearer ${token}` } }),
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/${id}`, {
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/${id}`, {
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/${id}/group`, {
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/${id}/reset-password`, {
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/groups`, {
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

    const handleCreateUser = async (values) => {
        const { username, password, role, group } = values;
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/create`, {
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
            alert("Пользователь успешно создан!");
            window.location.reload(); // Обновляем страницу
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
            const response = await fetch(`${baseBackendUrl}/admin-tools/groups/${groupName}`, {
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

    const handleSearch = (selectedKeys, confirm) => {
        confirm();
        setSearchText(selectedKeys[0]);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText("");
    };

    const userColumns = [
        { title: "ID", dataIndex: "id", key: "id" },
        {
            title: "Имя пользователя",
            dataIndex: "username",
            key: "username",
            sorter: (a, b) => a.username.localeCompare(b.username),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        ref={searchInput}
                        placeholder="Поиск пользователя"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => handleSearch(selectedKeys, confirm)}
                        style={{ width: 188, marginBottom: 8, display: "block" }}
                    />
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90, marginRight: 8 }}
                    >
                        Найти
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        Сброс
                    </Button>
                </div>
            ),
            onFilter: (value, record) => record.username.toLowerCase().includes(value.toLowerCase()),
            render: (text, record) => (
                <Input
                    readOnly
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
                    disabled={text === "admin" || text === "teacher"}
                    onChange={(value) =>
                        setUsers((prev) =>
                            prev.map((u) => (u.id === record.id ? { ...u, role: value } : u))
                        )
                    }
                    style={{ width: 120 }}
                >
                    <Option value="admin" disabled={true}>Админ</Option>
                    <Option value="teacher" disabled={true}>Ментор</Option>
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
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Select
                        showSearch
                        style={{ width: 188 }}
                        placeholder="Выберите группу"
                        value={selectedKeys[0]}
                        onChange={(value) => setSelectedKeys(value ? [value] : [])}
                    >
                        {groups.map((g) => (
                            <Select.Option key={g} value={g}>
                                {g}
                            </Select.Option>
                        ))}
                    </Select>
                    <div style={{ marginTop: 8 }}>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            size="small"
                            style={{ width: 90, marginRight: 8 }}
                        >
                            Найти
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Сброс
                        </Button>
                    </div>
                </div>
            ),
            onFilter: (value, record) => record.group === value,
            render: (text, record) => (
                <Select
                    disabled={text === "admin" || text === "mentor"}
                    value={text}
                    onChange={(value) => updateUser(record.id, { ...record, group: value })}
                    style={{ width: 120 }}
                >
                    {groups.map((g) => (
                        <Select.Option key={g} value={g}>
                            {g}
                        </Select.Option>
                    ))}
                </Select>
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
            <h1>Ментор: управление пользователями</h1>
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
                dataSource={groups
                    .filter(name => name !== "admin" && name !== "mentor")
                    .map(name => ({ name }))}
                rowKey="name"
                pagination={false}
                style={{ marginTop: 20 }}
            />
        </div>
    );
};

export default MentorPanel;
