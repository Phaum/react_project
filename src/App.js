import React, { useState } from "react";
import { Link, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
    DesktopOutlined,
    FileOutlined,
    NotificationOutlined,
    ReadOutlined,
    HomeOutlined,
    UserOutlined,
    TableOutlined,
    MoonOutlined,
    ContactsOutlined,
} from "@ant-design/icons";
import { Layout, Menu, theme, Button } from "antd";
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
// Таблица лидеров
import RatingTable from "./pages/RatingTable/jsx/RatingTable";

const { Header, Content, Footer, Sider } = Layout;

const App = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [themeMode, setThemeMode] = useState("light");

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const toggleTheme = () => {
        setThemeMode(themeMode === "light" ? "dark" : "light");
        document.body.setAttribute("data-theme", themeMode === "light" ? "dark" : "light");
    };

    const menuItems = [
        { label: <Link to="/news">Новости</Link>, key: "1", icon: <HomeOutlined /> },
        { label: <Link to="/announcements">Объявления</Link>, key: "2", icon: <NotificationOutlined /> },
        { label: <Link to="/materials">Материалы</Link>, key: "3", icon: <ReadOutlined /> },
        { label: <Link to="/contacts">Контакты</Link>, key: "4", icon: <ContactsOutlined /> },
        { label: <Link to="/rating_table">Рейтинг</Link>, key: "5", icon: <TableOutlined /> },
        { label: <Link to="/profile">Профиль</Link>, key: "6", icon: <UserOutlined /> },
        { label: <Button type="primary" onClick={toggleTheme}>
                {themeMode === "light" ? "Темная" : "Светлая"} тема
            </Button>, key: "7", icon: <MoonOutlined /> },
        // { label: <Link to="/files">Файлы</Link>, key: "6", icon: <FileOutlined /> },
    ];

    return (
        <Router>
            <Layout style={{ minHeight: "100vh" }}>
                {/* Левое боковое меню */}
                <div style={{ position: "fixed" }} >

                </div>
                <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                    <div className="logo" style={{ padding: "20px", textAlign: "center", color: "#fff" }}>
                        {!collapsed ? "Меню" : "🔹"}
                    </div>
                    <Menu theme="dark" mode="inline" items={menuItems} />
                </Sider>

                <Layout>
                    {/* Верхняя панель */}
                    <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: colorBgContainer }}>
                        <h2>Тут будет название и логотип</h2>
                    </Header>

                    {/* Контент */}
                    <Content style={{ margin: "0 16px", padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
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
                            <Route path="/rating_table" element={<RatingTable />} />
                            <Route path="/files" element={<Files />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/registration" element={<Registration />} />
                            <Route path="/" element={<Registration />} />
                            <Route path="/admin-tools" element={<AdminPanel />} />
                        </Routes>
                    </Content>

                    {/* Подвал */}
                    <Footer style={{ textAlign: "center" }}>Phaum Studio {new Date().getFullYear()} Created by Phaum</Footer>
                </Layout>
            </Layout>
        </Router>
    );
};

export default App;
