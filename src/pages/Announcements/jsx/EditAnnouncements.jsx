import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";
import {baseBackendUrl} from "../../../shared/constants"

const EditAnnouncements = () => {
    const { id } = useParams();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [newImage, setNewImage] = useState(null);
    const [files, setFiles] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [audience, setAudience] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const getToken = () => localStorage.getItem("token");
        const fetchAnnouncements = async () => {
            try {
                const token = getToken();
                const response = await fetch(`${baseBackendUrl}/announcements/${id}`,{
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && {Authorization: `Bearer ${token}`}),
                    },
                });
                if (!response.ok) {
                    throw new Error("Не удалось загрузить данные новости");
                }
                const data = await response.json();
                setTitle(data.title);
                setContent(data.content);
                setImage(data.image);
                setFiles(data.files || []);
                setAudience(data.audience || []);
                setSelectedGroups(data.groups || []);
            } catch (error) {
                console.error("Ошибка при загрузке новости:", error);
                setError("Ошибка при загрузке данных");
                navigate("/announcements");
            }
        };
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");
                const groupsResponse = await fetch(`${baseBackendUrl}/announcements/groups`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                const newsResponse = await fetch(`${baseBackendUrl}/announcements/${id}/groups`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });

                if (!groupsResponse.ok || !newsResponse.ok) {
                    throw new Error("Ошибка загрузки данных");
                }
                const allGroupsData = await groupsResponse.json();
                const newsData = await newsResponse.json();
                setAllGroups(allGroupsData || []);
                setSelectedGroups(newsData.group || []);
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
                setAllGroups([]);
                setSelectedGroups([]);
            }
        };
        fetchAnnouncements();
        fetchGroups();
    }, [id, token]);

    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setAudience((prev) => [...prev, value]);
        } else {
            setAudience((prev) => prev.filter((role) => role !== value));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${baseBackendUrl}/announcements/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, content, audience, groups: selectedGroups }),
            });
            if (response.ok) {
                alert("Новость успешно обновлена");
                navigate(`/announcements/${id}`);
            } else {
                const errorMessage = await response.text();
                console.error("Ошибка при обновлении новости:", errorMessage);
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка при обновлении новости:", error);
            alert("Произошла ошибка при обновлении");
        }
    };

    const handleImageUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("image", newImage);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${baseBackendUrl}/announcements/${id}/upload_image`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                setImage(data.imageUrl);
                alert("Изображение успешно загружено");
                window.location.reload();
            } else {
                const errorMessage = await response.text();
                console.error("Ошибка при загрузке изображения:", errorMessage);
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка при загрузке изображения:", error);
            alert("Произошла ошибка при загрузке изображения");
        }
    };

    const handleImageDelete = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${baseBackendUrl}/announcements/${id}/delete_image`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                setImage(null);
                alert("Изображение успешно удалено");
                window.location.reload();
            } else {
                const errorMessage = await response.text();
                console.error("Ошибка при удалении изображения:", errorMessage);
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка при удалении изображения:", error);
            alert("Произошла ошибка при удалении изображения");
        }
    };

    if (error) {
        return <p>{error}</p>;
    }

    const handleFileDelete = async (e, fileUrl) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const filename = decodeURIComponent(fileUrl.split("/").pop());
            const response = await fetch(`${baseBackendUrl}/announcements/${id}/${filename}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка при удалении файла: ${errorMessage}`);
            }
            setFiles((prevFiles) => prevFiles.filter((file) => file.url !== fileUrl));
            alert("Файл успешно удален");
            window.location.reload();
        } catch (error) {
            console.error("Ошибка удаления файла:", error);
            alert(`Ошибка удаления файла: ${error.message}`);
        }
    };
    const uploadNewFilesDop = async (e) => {
        e.preventDefault();
        if (newFiles.length === 0) {
            alert("Выберите файлы для загрузки");
            return;
        }
        const token = localStorage.getItem("token");
        const formData = new FormData();
        newFiles.forEach((file) => formData.append("files", file));
        try {
            const response = await fetch(`${baseBackendUrl}/announcements/${id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Ошибка при загрузке файлов");
            }
            const data = await response.json();
            setFiles((prev) => [...prev, ...data.files]);
            setNewFiles([]);
            alert("Файлы успешно загружены");
            window.location.reload();
        } catch (error) {
            console.error("Ошибка загрузки файлов:", error);
            alert("Ошибка загрузки файлов");
        }
    };

    return (
        <div className="main-container">
            <h1>Редактировать объявление</h1>
            <form onSubmit={handleUpdate}>
                <div>
                    <label htmlFor="title">Заголовок:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Аудитория:</label>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                value="guest"
                                checked={audience.includes("guest")}
                                onChange={handleCheckboxChange}
                            />
                            Гости
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="student"
                                checked={audience.includes("student")}
                                onChange={handleCheckboxChange}
                            />
                            Студенты
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="teacher"
                                checked={audience.includes("teacher")}
                                onChange={handleCheckboxChange}
                            />
                            Учителя
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                value="admin"
                                checked={audience.includes("admin")}
                                onChange={handleCheckboxChange}
                            />
                            Администраторы
                        </label>
                    </div>
                </div>
                <h3>Выберите группы:</h3>
                <table border="1">
                    <thead>
                    <tr>
                        <th>Выбрать</th>
                        <th>Название группы</th>
                    </tr>
                    </thead>
                    <tbody>
                    {allGroups.map((group) => (
                        <tr key={group}>
                            <td>
                                <input
                                    type="checkbox"
                                    value={group}
                                    checked={selectedGroups.includes(group)}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSelectedGroups((prevSelected) =>
                                            prevSelected.includes(value)
                                                ? prevSelected.filter((g) => g !== value)
                                                : [...prevSelected, value]
                                        );
                                    }}
                                />
                            </td>
                            <td>{group}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div>
                    <label htmlFor="content">Содержание:</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        required
                    />
                </div>
                {image && (
                    <div>
                        <p>Текущее изображение:</p>
                        <img className="announcements-container-image" src={image} alt={title} width="50%"/>
                        <button className="delete-button" type="button" onClick={handleImageDelete}>
                            Удалить изображение
                        </button>
                    </div>
                )}
                <div>
                    <label htmlFor="newImage">Загрузить новое изображение:</label>
                    <input
                        type="file"
                        id="newImage"
                        accept="image/*"
                        onChange={(e) => setNewImage(e.target.files[0])}
                    />
                    <button type="button" onClick={handleImageUpload}>
                        Загрузить
                    </button>
                </div>
                <h3>Прикрепленные файлы:</h3>
                <ul>
                    {files.map((file) => (
                        <div key={file.name}>
                            <DownloadFile file={file} />
                            <button className="delete-button" onClick={(e) => handleFileDelete(e,file.name)}>Удалить</button>
                        </div>
                    ))}
                </ul>
                <div>
                    <label>Добавить файлы (до 5 файлов):</label>
                    <input
                        type="file"
                        multiple
                        onChange={(e) => setNewFiles([...e.target.files])}
                    />
                    <button onClick={uploadNewFilesDop}>Загрузить файлы</button>
                </div>
                <h2>Предварительный просмотр</h2>
                <div className="preview">
                    <MarkdownRenderer content={content} />
                </div>
                <div className="fixed-buttons-container">
                    <button type="submit">Сохранить изменения</button>
                </div>
            </form>
        </div>
    );
};

export default EditAnnouncements;
