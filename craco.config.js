const CracoLessPlugin = require("craco-less");

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: {
                            "@primary-color": "#1890ff", // Основной цвет
                            "@body-background": "#ffffff", // Фон для светлой темы
                            "@text-color": "#000000", // Цвет текста
                        },
                        javascriptEnabled: true,
                    },
                },
            },
        },
    ],
};
