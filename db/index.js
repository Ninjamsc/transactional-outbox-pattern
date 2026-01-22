const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool(config);

console.log("PostgreSQL connection pool initialized.");

const query = (text, params) => pool.query(text, params);

const checkDBConnection = async () => {
    try{
        const res = await pool.query("SELECT NOW()");
        console.log('Database connection successful', res.rows[0]);
        return true;
    } catch (error){
        console.error('Database connection failed: ', error);
    }
}

module.exports = {
    query: query,
    checkDBConnection: checkDBConnection,
    pool: pool
}