import React, { useEffect, useState } from "react";
import { Table, Button, InputNumber, Popconfirm, Form, Modal, Select, message } from "antd";
const API_URL = "http://localhost:5000/ranking";
const GROUPS_URL = "http://localhost:5000/ranking/groups";

const RatingTable = () => {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [newTeam, setNewTeam] = useState({ group: "", points: 0 });
    const [canEdit, setCanEdit] = useState(false);
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        fetchRanking();
        fetchGroups();
    }, []);

    const fetchRanking = async () => {
        setLoading(true);
        const token = getToken();
        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
            });
            if (response.status === 403) {
                throw new Error("Ошибка доступа: нет прав на просмотр рейтинга.");
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error("Ошибка данных с сервера:", data);
                throw new Error("Ожидался массив, получен другой тип данных");
            }
            setRanking(data);
            if (data.some(team => team.canEdit)) {
                setCanEdit(true);
            } else {
                setCanEdit(false);
            }
        } catch (error) {
            console.error("Ошибка загрузки рейтинга:", error);
            setRanking([]);
        }
        setLoading(false);
    };

    const fetchGroups = async () => {
        const token = getToken();
        try {
            const response = await fetch(GROUPS_URL, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
            });
            const data = await response.json();
            setGroups(data);
        } catch (error) {
            console.error("Ошибка загрузки групп:", error);
            setGroups([]);
        }
    };

    const deleteTeam = async (id) => {
        const token = getToken();
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
            });
            setRanking((prev) => prev.filter((team) => team.id !== id));
        } catch (error) {
            console.error("Ошибка удаления:", error);
        }
    };

    const updatePoints = async (id, points) => {
        const token = getToken();
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
                body: JSON.stringify({ points }),
            });
            setRanking((prev) =>
                prev.map((team) => (team.id === id ? { ...team, points } : team))
            );
        } catch (error) {
            console.error("Ошибка обновления баллов:", error);
        }
    };

    const addTeam = async () => {
        const token = getToken();
        if (!newTeam.group || !groups.includes(newTeam.group)) {
            message.error("Выберите существующую группу!");
            return;
        }
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
                body: JSON.stringify(newTeam),
            });
            const data = await response.json();
            setRanking((prev) => [...prev, data.team]);
            setIsModalOpen(false);
            setNewTeam({ group: "", points: 0 });
            window.location.reload();
        } catch (error) {
            console.error("Ошибка добавления команды:", error);
        }
    };

    const columns = [
        { title: "Группа", dataIndex: "group", key: "group" },
        {
            title: "Баллы",
            dataIndex: "points",
            key: "points",
            sorter: (a, b) => b.points - a.points,
            render: (text, record) =>
                record.canEdit ? (
                    <InputNumber
                        min={0}
                        value={record.points}
                        onChange={(value) => updatePoints(record.id, value)}
                    />
                ) : (
                    <span>{record.points}</span>
                ),
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) =>
                record.canEdit ? (
                    <Popconfirm title="Удалить команду?" onConfirm={() => deleteTeam(record.id)}>
                        <Button danger>Удалить</Button>
                    </Popconfirm>
                ) : null,
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Таблица рейтинга групп</h2>
            {canEdit && (
                <Button type="primary" onClick={() => setIsModalOpen(true)} style={{ marginBottom: 16 }}>
                    Добавить команду
                </Button>
            )}
            <Table dataSource={ranking} columns={columns} rowKey="id" loading={loading} />
            <Modal title="Добавить команду" open={isModalOpen} onOk={addTeam} onCancel={() => setIsModalOpen(false)}>
                <Form layout="vertical">
                    <Form.Item label="Название группы">
                        <Select
                            placeholder="Выберите группу"
                            value={newTeam.group}
                            onChange={(value) => setNewTeam({ ...newTeam, group: value })}
                        >
                            {groups.map((group) => (
                                <Select.Option key={group} value={group}>
                                    {group}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Баллы">
                        <InputNumber
                            min={0}
                            value={newTeam.points}
                            onChange={(value) => setNewTeam({ ...newTeam, points: value })}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RatingTable;
