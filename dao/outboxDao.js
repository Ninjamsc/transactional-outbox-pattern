const { pool } = require("../db");

const fetchUnseenMessage = async () => {
    const client = await pool.connect();
    
    try{
        await client.query('BEGIN');

        const result = await client.query(`
            SELECT id, aggregate_type, aggregate_id, event_type, payload
            FROM outbox WHERE status = 'PENDING'
            ORDER BY created_at ASC FOR UPDATE SKIP LOCKED
            LIMIT 1;
        `);

        if (result.rows.length === 0){
            await client.query('ROLLBACK');
            return null;
        }

        const message = result.rows[0];
        
        await client.query(`
            UPDATE outbox SET status = 'PROCESSING' WHERE id = $1;
            `, [message.id]
        );

        await client.query('COMMIT');
        return message;
    } catch (err){
        await client.query('ROLLBACK');
        console.error('ERROR fetching unsent message: ', err);
        throw err;
    } finally{
        client.release();
    }
};

const markMessageAsSent = async (id) => {
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        await client.query(`
            UPDATE outbox SET status = 'SENT', sent_at = NOW() WHERE id = $1 AND STATUS = 'PROCESSING';
            `, [id]
        );
        await client.query('COMMIT');
    } catch (err){
        await client.query('ROLLBACK');
        console.error('Error marking message as sent: ', err);
        throw err;
    } finally{
        client.release();
    }
}

const markMessageAsFailed = async (id) => {
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        await client.query(`
            UPDATE outbox SET status = 'FAILED', sent_at = NOW() WHERE id = $1 AND status = 'PROCESSING';
        `, [id]);
        await client.query('COMMIT');
    } catch (err){
        await client.query('ROLLBACK');
        console.error('Error marking message as failed: ', err);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    fetchUnseenMessage: fetchUnseenMessage,
    markMessageAsSent: markMessageAsSent,
    markMessageAsFailed: markMessageAsFailed,
};