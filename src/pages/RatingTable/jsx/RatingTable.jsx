// import React from "react";
//
// const Contacts = () => {
//     return (
//         <div className="main-container">
//             <h1>Таблица рейтинга</h1>
//             <p>Здесь вы найдете информацию по текущему рейтингу</p>
//         </div>
//     );
// };
//
// export default Contacts;

import React, { useEffect, useState } from "react";
import { Table, Button, InputNumber, Popconfirm, Form, Modal, Input, Select, message } from "antd";
const API_URL = "http://localhost:5000/ranking";
const GROUPS_URL = "http://localhost:5000/ranking/groups";

const RatingTable = () => {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [newTeam, setNewTeam] = useState({ group: "", points: 0 });
    useEffect(() => {
        fetchRanking();
        fetchGroups();
    }, []);
    // Загрузка данных
    const fetchRanking = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error("Ожидался массив, получен другой тип данных");
            }
            setRanking(data);
        } catch (error) {
            console.error("Ошибка загрузки рейтинга:", error);
            setRanking([]); // Фикс: если ошибка - устанавливаем пустой массив
        }
        setLoading(false);
    };

    // Загрузка списка доступных групп
    const fetchGroups = async () => {
        try {
            const response = await fetch(GROUPS_URL);
            const data = await response.json();
            setGroups(data);
        } catch (error) {
            console.error("Ошибка загрузки групп:", error);
            setGroups([]);
        }
    };

    // Удаление команды
    const deleteTeam = async (id) => {
        try {
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            setRanking((prev) => prev.filter((team) => team.id !== id));
        } catch (error) {
            console.error("Ошибка удаления:", error);
        }
    };

    // Обновление баллов
    const updatePoints = async (id, points) => {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ points }),
            });
            setRanking((prev) => prev.map((team) => (team.id === id ? { ...team, points } : team)));
        } catch (error) {
            console.error("Ошибка обновления баллов:", error);
        }
    };

    // Добавление новой команды
    const addTeam = async () => {
        if (!newTeam.group || !groups.includes(newTeam.group)) {
            message.error("Выберите существующую группу!");
            return;
        }
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTeam),
            });
            const data = await response.json();
            setRanking((prev) => [...prev, data.team]);
            setIsModalOpen(false);
            setNewTeam({ group: "", points: 0 });
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
            render: (text, record) => (
                <InputNumber min={0} value={record.points} onChange={(value) => updatePoints(record.id, value)} />
            ),
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <Popconfirm title="Удалить команду?" onConfirm={() => deleteTeam(record.id)}>
                    <Button danger>Удалить</Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Таблица рейтинга групп</h2>
            <Button type="primary" onClick={() => setIsModalOpen(true)} style={{ marginBottom: 16 }}>
                Добавить команду
            </Button>
            <Table dataSource={ranking} columns={columns} rowKey="id" loading={loading} />
            {/* Модальное окно для добавления команды */}
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
