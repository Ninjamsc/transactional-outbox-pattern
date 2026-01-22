const { pool, query } = require("../db");

const createTransactionRequestWithOutbox = async (fromAccountId, toAccountId, amount, idempotencyKey) => {
    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        // 1. Insert the new PENDING transaction request record.
        const requestSql = `
        INSERT INTO transaction_requests (idempotency_key, from_account_id, to_account_id, amount, status)
        VALUES ($1, $2, $3, $4, 'PENDING')
        RETURNING id, idempotency_key, from_account_id, to_account_id, amount, status, created_at;
        `; 
        const requestResult = await client.query(requestSql, [idempotencyKey, fromAccountId, toAccountId, amount]);
        const request = requestResult.rows[0];

        const outboxSql = `
        INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        `;  
        
        const payLoad = {
            requestId: request.id,
            fromAccountId: fromAccountId,
            toAccountId: toAccountId,
            amount: amount
        };
        await client.query(outboxSql, ['Transaction', request.id, 'TransactionRequested', payLoad]);
        await client.query('COMMIT');

        return request;
    } catch (error){
        await client.query('ROLLBACK');
        console.error('Error in createTransactionRequestWithOutbox:', error);
        throw error;
    } finally{
        client.release();
    }
};

const findRequestByImpotencyKey = async (idempotencyKey) => {
    const sql = `
    SELECT id, status FROM transaction_requests WHERE idempotency_key = $1;
    `;
    const result = await query(sql, [idempotencyKey]);
    return result.rows[0] || null;
};

const findCompletedTransactionByRequestId = async (requestId) => {
    const sql = `
    SELECT * FROM transactions WHERE request_id = $1;
    `;
    const result = await query(sql, [requestId]);
    return result.rows[0] || null;
};

module.exports = {
    createTransactionRequestWithOutbox: createTransactionRequestWithOutbox,
    findRequestByImpotencyKey: findRequestByImpotencyKey,
    findCompletedTransactionByRequestId: findCompletedTransactionByRequestId,
};