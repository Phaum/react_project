import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { message } from "antd";

export const exportToExcel = (data, fileName = "export") => {
    if (!data || !data.length) {
        message.warning("Нет данных для экспорта!");
        return;
    }
    // Формируем данные для таблицы
    const formattedData = data.map(({ id, login, username, lastName, stud_group, role, group }) => ({
        ID: id,
        "login": login,
        "Имя" : username,
        "Фамилия" : lastName,
        "Студенческая группа" : stud_group,
        "Роль": role,
        "Группа": group,
    }));

    // Создаем новый лист Excel
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Пользователи");

    // Генерируем Excel-файл
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // Создаем Blob и скачиваем файл
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, `${fileName}_${new Date().toLocaleDateString("ru-RU")}.xlsx`);
};
