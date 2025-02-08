import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Menu.css";

const Menu = () => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для меню

    const menuItems = [
        { id: 1, name: "Новости", link: "/news" },
        { id: 2, name: "Объявления", link: "/announcements" },
        { id: 3, name: "Материалы", link: "/materials" },
        { id: 4, name: "Контакты", link: "/contacts" },
        // { id: 5, name: "Файлы", link: "/files" },
        { id: 5, name: "Таблица рейтинга", link: "/rating_table"},
        { id: 6, name: "Профиль", link: "/profile" }
    ];

    return (
        <nav className="menu-container">
            {/* Основное меню */}
            <ul className={`menu ${isOpen ? "open" : ""}`}>
                {menuItems.map((item) => (
                    <li key={item.id} className="menu-item">
                        <Link to={item.link}>{item.name}</Link>
                    </li>
                ))}
            </ul>

            {/* Кнопка для мобильного меню */}
            {/*<button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>*/}
            {/*    ☰*/}
            {/*</button>*/}

            {/*/!* Выпадающее меню для скрытых пунктов *!/*/}
            {/*{isOpen && (*/}
            {/*    <div className="dropdown-menu">*/}
            {/*        {menuItems.map((item) => (*/}
            {/*            <Link key={item.id} to={item.link} className="dropdown-item" onClick={() => setIsOpen(false)}>*/}
            {/*                {item.name}*/}
            {/*            </Link>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}
        </nav>
    );
};

export default Menu;
