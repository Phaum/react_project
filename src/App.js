import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Menu from "./UI/Menu";
import "./App.css"

// Новости
import News from "./pages/News/jsx/News";
import CreateNews from "./pages/News/jsx/CreateNews";
import NewsDetail from "./pages/News/jsx/NewsDetail";
import EditNews from "./pages/News/jsx/EditNews";

// Обьявления
import Announcements from "./pages/Announcements/jsx/Announcements";
import CreateAnnouncements from "./pages/Announcements/jsx/CreateAnnouncements";
import AnnouncementsDetail from "./pages/Announcements/jsx/AnnouncementsDetail";
import EditAnnouncements from "./pages/Announcements/jsx/EditAnnouncements";

// Материалы
import Materials from "./pages/Materials/jsx/Materials";
import CreateMaterials from "./pages/Materials/jsx/CreateMaterials";
import MaterialsDetail from "./pages/Materials/jsx/MaterialsDetail";
import EditMaterials from "./pages/Materials/jsx/EditMaterials";
import ArticleDetail from "./pages/Materials/jsx/ArticleDetail";
import EditArticle from "./pages/Materials/jsx/EditArticles";

// Контакты
import Contacts from "./pages/Contacts/Contacts";

// Файлы
import Files from "./pages/Files/Files";

// Профиль
import Profile from "./pages/Profile/Profile";
import Registration from "./pages/Authorization/Registration";
import AdminPanel from "./pages/AdminPanel/jsx/AdminPanel"

const App = () => {
    return (
        <Router>
            <div className="layout">
                <div className="sidebar">
                    <Menu />
                </div>
                <main className="content">
                    <Routes>
                        <Route path="/news" element={<News />} />
                        <Route path="/news/:id" element={<NewsDetail />} />
                        <Route path="/create_news" element={<CreateNews />} />
                        <Route path="/news/edit/:id" element={<EditNews />} />
                        <Route path="/announcements" element={<Announcements />} />
                        <Route path="/announcements/:id" element={<AnnouncementsDetail />} />
                        <Route path="/create_announcements" element={<CreateAnnouncements />} />
                        <Route path="/announcements/edit/:id" element={<EditAnnouncements />} />
                        <Route path="/materials" element={<Materials />} />
                        <Route path="/materials/:id" element={<MaterialsDetail />} />
                        <Route path="/create_materials" element={<CreateMaterials />} />
                        <Route path="/materials/edit/:id" element={<EditMaterials />} />
                        <Route path="/materials/:id/articles/:articleId" element={<ArticleDetail />} />
                        <Route path="/materials/:id/articles/:articleId/edit" element={<EditArticle />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/files" element={<Files />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/registration" element={<Registration />} />
                        <Route path="/" element={<Registration />} />
                        <Route path="/admin-tools" element={<AdminPanel />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
