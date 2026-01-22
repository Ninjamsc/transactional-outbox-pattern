const { checkDBConnection } = require("../db/index");

const getHealthStatus = async (req, res) => {
    try{
        const isDbConnected = checkDBConnection();

        if (isDbConnected){
            res.status(200).json({
                status: 'OK',
                message: 'API is healthy and connected to the database',
                timestamp: new Date().toISOString(),
            });
        } else{
            res.status(503).json({
                status: 'ERROR',
                message: 'API is running but database connection failed',
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error){
        console.error('Error during health check: ', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Internal server error during health check',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
}

module.exports = {
    getHealthStatus: getHealthStatus,
};