import { checkDbConnection } from "../config/db.js";

export const getHealthStatus = async (req, res, next) => {
    try {
        const dbStatus = await checkDbConnection();
        if (dbStatus) {
            res.status(200).json({
                status: "UP",
                checks: [
                    {
                        name: "database",
                        status: "UP",
                    },
                ],
            });
        } else {
            res.status(503).json({
                status: "DOWN",
                checks: [
                    {
                        name: "database",
                        status: "DOWN",
                        error: "Database connection failed",
                    },
                ],
            });
        }
    } catch (error) {
        next(error);
    }
};
