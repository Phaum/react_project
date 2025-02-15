const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} | ${level.toUpperCase()} | ${message}`)
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, "logs", "user-actions.log") })
    ],
});

const logAction = (userId, action, details) => {
    const message = `UserID: ${userId} | Action: ${action} | Details: ${JSON.stringify(details)}`;
    logger.info(message);
};

module.exports = { logAction, logger };
