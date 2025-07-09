export const alertConfig = {
    priceDropThreshold: 0.1, // 10% drop
    recipientEmail: 'your-email@example.com', // Replace with your actual email
    channels: {
        email: {
            enabled: false,
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            from: 'Price Tracker Alerts <alerts@example.com>' // Replace with a "from" address
        },
        telegram: {
            enabled: true,
            botToken: "7698515136:AAGYaE1LEZt-_b34PW59cQtNKcGZ3Bcg1DI",
            chatId: "-1002813213168"
        }
    }
}; 