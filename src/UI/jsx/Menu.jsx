// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import "../css/Menu.css";
//
// const Menu = () => {
//     const [isOpen, setIsOpen] = useState(false); // Состояние для меню
//
//     const menuItems = [
//         { id: 1, name: "Новости", link: "/news" },
//         { id: 2, name: "Объявления", link: "/announcements" },
//         { id: 3, name: "Материалы", link: "/materials" },
//         { id: 4, name: "Контакты", link: "/contacts" },
//         // { id: 5, name: "Файлы", link: "/files" },
//         { id: 5, name: "Таблица рейтинга", link: "/rating_table"},
//         { id: 6, name: "Профиль", link: "/profile" }
//     ];
//
//     return (
//         <nav className="menu-container">
//             <ul className={`menu ${isOpen ? "open" : ""}`}>
//                 {menuItems.map((item) => (
//                     <li key={item.id} className="menu-item">
//                         <Link to={item.link}>{item.name}</Link>
//                     </li>
//                 ))}
//             </ul>
//         </nav>
//     );
// };
//
// export default Menu;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "antd";
import "../css/Menu.css";

const Menu = ({ theme, toggleTheme }) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 1, name: "Новости", link: "/news" },
        { id: 2, name: "Объявления", link: "/announcements" },
        { id: 3, name: "Материалы", link: "/materials" },
        { id: 4, name: "Контакты", link: "/contacts" },
        { id: 5, name: "Таблица рейтинга", link: "/rating_table" },
        { id: 6, name: "Профиль", link: "/profile" }
    ];

    return (
        <nav className="menu-container">
            {/*<button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>*/}
            {/*    ☰*/}
            {/*</button>*/}

            {isOpen && (
                <div className="dropdown-menu">
                    {menuItems.map((item) => (
                        <Link key={item.id} to={item.link} className="dropdown-item" onClick={() => setIsOpen(false)}>
                            {item.name}
                        </Link>
                    ))}
                </div>
            )}

            <ul className="menu">
                {menuItems.map((item) => (
                    <li key={item.id} className="menu-item">
                        <Link to={item.link}>{item.name}</Link>
                    </li>
                ))}
            </ul>

            <div className="theme-toggle">
                <Button type="primary" onClick={toggleTheme}>
                    {theme === "light" ? "Темная" : "Светлая"} тема
                </Button>
            </div>
        </nav>
    );
};

export default Menu;
