const { pool } = require("../db/index");
const bcrypt = require('bcryptjs');

const createUserAndAccount = async (email, password, initialBalance = 0, phoneNumber = null) => {
    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const passwordHash = await bcrypt.hash(password, 10);

        const userInsertResult = await client.query(
            'INSERT INTO users (email, password_hash, phone_number, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
            [email, passwordHash, phoneNumber]
        );
        const newUserId = userInsertResult.rows[0].id;

        const accountInsertResult = await client.query(
            'INSERT INTO accounts (user_id, balance, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id', 
            [newUserId, initialBalance]
        );

        const newAccountId = accountInsertResult.rows[0].id;

        await client.query('COMMIT');

        return { userId: newUserId, accountId: newAccountId};
    } catch (error){
        await client.query('ROLLBACK');
        console.error('Error during user and account creation: ', error);

        if (error.code === '23505'){ //PostgreSQL error code for unique_violation
            throw new Error('User with this email already exists.');
        }
        throw error;
    } finally{
        client.release();
    }
};

const findUserByEmail = async (email) => {
    try{
        const result = await pool.query('SELECT id, email, password_hash, phone_number FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    } catch (error){
        console.error('Error finding user by email in DAO: ', error);
        throw error;
    }
};


module.exports = {
    createUserAndAccount: createUserAndAccount,
    findUserByEmail: findUserByEmail,
};