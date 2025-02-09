import React, { useEffect, useState } from "react";
import { useParams,Link, useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../../UI/jsx/MarkdownRenderer";
import DownloadFile from "../../../UI/jsx/DownloadFile";

const EditMaterials = () => {
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
    const [articles, setArticles] = useState([]);
    const [newArticle, setNewArticle] = useState({ title: "", content: "" });

    useEffect(() => {
        const getToken = () => localStorage.getItem("token");
        const fetchMaterials = async () => {
            try {
                const token = getToken();
                const response = await fetch(`http://localhost:5000/materials/${id}`,{
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
            }
        };

        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");
                const groupsResponse = await fetch("http://localhost:5000/materials/groups", {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                const newsResponse = await fetch(`http://localhost:5000/materials/${id}/groups`, {
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
        const fetchArticles = async () => {
            try {
                const response = await fetch(`http://localhost:5000/materials/${id}/articles`,{
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && {Authorization: `Bearer ${token}`}),
                    },
                });
                if (!response.ok) throw new Error("Ошибка загрузки статей");
                const data = await response.json();
                setArticles(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchMaterials();
        fetchGroups();
        fetchArticles();
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
            const response = await fetch(`http://localhost:5000/materials/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, content, audience, groups: selectedGroups }),
            });
            if (response.ok) {
                alert("Новость успешно обновлена");
                navigate(`/materials/${id}`);
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
            const response = await fetch(`http://localhost:5000/materials/${id}/upload_image`, {
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
            const response = await fetch(`http://localhost:5000/materials/${id}/delete_image`, {
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
            const response = await fetch(`http://localhost:5000/materials/${id}/${filename}`, {
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
            const response = await fetch(`http://localhost:5000/materials/${id}`, {
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

    const addArticle = async (e) => {
        e.preventDefault();
        if (!newArticle.title || !newArticle.content) {
            alert("Заполните все поля");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/materials/${id}/articles`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newArticle),
            });
            if (response.ok) {
                const data = await response.json();
                setArticles([...articles, data.article]);
                setNewArticle({ title: "", content: "" });
            } else {
                alert("Ошибка при добавлении статьи");
            }
        } catch (error) {
            console.error("Ошибка при добавлении статьи", error);
        }
    };

    const deleteArticle = async (e, articleId) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/materials/${id}/articles/${articleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setArticles(articles.filter((article) => article.id !== articleId));
                window.location.reload();
            } else {
                alert("Ошибка при удалении статьи");
            }
        } catch (error) {
            console.error("Ошибка при удалении статьи", error);
        }
    };

    return (
        <div className="main-container">
            <h1>Редактировать материал</h1>
            <form onSubmit={handleUpdate}>
                <div className="detail-container">
                    <label htmlFor="title">Заголовок: (Markdown)</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="detail-container">
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
                <div className="detail-container">
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
                </div>

                <div>
                    <label htmlFor="content">
                        <h3>Содержание: (Markdown)</h3>
                    </label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        required
                    />
                </div>

                {image && (
                    <div className="detail-container">
                        <h3>Текущее изображение:</h3>
                        <img className="materials-container" src={image} alt={title} width="50%"/>
                        <button className="delete-button" type="button" onClick={handleImageDelete}>
                            Удалить изображение
                        </button>
                    </div>
                )}

                <div className="detail-container">
                    <label htmlFor="newImage">
                        <h3>Загрузить новое изображение:</h3>
                    </label>
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
                <div className="detail-container">
                    <h3>Прикрепленные файлы:</h3>
                    <ul>
                        {files.map((file) => (
                            <div key={file.name}>
                                <DownloadFile file={file} />
                                <button className="delete-button" onClick={(e) => handleFileDelete(e,file.name)}>Удалить</button>
                            </div>
                        ))}
                    </ul>
                </div>
                <div className="detail-container">
                    <label>Добавить файлы (до 5 файлов):</label>
                    <input
                        type="file"
                        multiple
                        onChange={(e) => setNewFiles([...e.target.files])}
                    />
                    <button onClick={uploadNewFilesDop}>Загрузить файлы</button>
                </div>
                <div>
                    <div>
                        <h2>Статьи</h2>
                        {articles.length > 0 ? (
                            <ul>
                                {articles.map((article) => (
                                    <div className="detail-container" key={article.id}>
                                        <div>
                                            <Link to={`/materials/${id}/articles/${article.id}`}>
                                                <MarkdownRenderer content={article.title}/>
                                            </Link>
                                        </div>
                                        <div>
                                            <Link to={`/materials/${id}/articles/${article.id}/edit`} className="edit-button">
                                                Редактировать
                                            </Link>
                                            <button className="delete-button" onClick={(e) => deleteArticle(e, article.id)}>Удалить</button>
                                        </div>

                                    </div>
                                ))}
                            </ul>
                        ) : (
                            <p>Статьи отсутствуют</p>
                        )}
                    </div>
                    <h2>Добавить статью</h2>
                    <div>
                        <input
                            type="text"
                            placeholder="Заголовок (Markdown)"
                            value={newArticle.title}
                            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        />
                        <textarea
                            placeholder="Примерное содержание (Markdown)"
                            value={newArticle.content}
                            onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                        />
                        <button onClick={addArticle}>Добавить статью</button>
                    </div>
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

export default EditMaterials;
