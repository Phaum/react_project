import React, { useState, useEffect } from "react";
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
import { Layout, Menu, theme, Button, ConfigProvider } from "antd";
import "./themes/light.less";
import "./themes/dark.less";
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
import MentorPanel from "./pages/AdminPanel/jsx/MentorPanel";
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
        { label: <Link to="/rating_table">Рейтинг</Link>, key: "5", icon: <TableOutlined /> },
        { label: <Link to="/contacts">Контакты</Link>, key: "4", icon: <ContactsOutlined /> },
        { label: <Link to="/profile">Профиль</Link>, key: "6", icon: <UserOutlined /> },
    ];

    return (
        <Router>
            <Layout style={{ minHeight: "100vh" }}>
                <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                    <div style={{ padding: "20px", textAlign: "center", color: "#fff" }}>
                        {!collapsed ?
                            <Button type="primary" onClick={toggleTheme}>
                                {themeMode === "light" ? "Темная" : "Светлая"} тема
                            </Button> :
                            <Button type="primary" onClick={toggleTheme}>
                                {themeMode === "light" ? <MoonOutlined /> : <MoonOutlined />}
                            </Button>
                        }

                    </div>

                    <Menu theme="dark" mode="inline" items={menuItems} />
                </Sider>

                <Layout>
                    {/* Верхняя панель */}
                    <Header style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: colorBgContainer }}>
                        <h2>Code.ak</h2>
                        {/*<img src={`${process.env.PUBLIC_URL}/icon.png`} alt="Logo" style={{ height: "40px" }} />*/}
                        <img
                            src={themeMode === "light" ? `${process.env.PUBLIC_URL}/icon.png` : `${process.env.PUBLIC_URL}/icon1.png`}
                            alt="Logo"
                            style={{ height: "40px" }}
                        />
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
                            <Route path={"/mentor-tools"} element={<MentorPanel />} />
                        </Routes>
                    </Content>

                    {/* Подвал */}
                    <Footer style={{ textAlign: "center" }}>Created by Phaum {new Date().getFullYear()}</Footer>
                </Layout>
            </Layout>
        </Router>
    );
};

export default App;
