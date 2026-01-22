const { query } = require("../db");

const findAccountById = async (accountId) => {
    try{
        const sql = `SELECT id, user_id, balance, created_at FROM accounts WHERE id = $1;`;
        const result = await query(sql, [accountId]);

        return result.rows[0] || null;
    } catch (error){
        console.error('Error finding account by ID: ', error);
        throw error;
    }
};

module.exports = {
    findAccountById: findAccountById,
};