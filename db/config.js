const dotenv = require("dotenv");
dotenv.config();

const config = {
    user: 'postgres',
    host: 'localhost',
    database: process.env.POSTGRES_DB_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
};

module.exports = config;