const { createTransactionRequest } = require("../services");

const createTransactionController = async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'];
    const { fromAccountId, toAccountId, amount } = req.body;
    
    if (!idempotencyKey){
        return res.status(400).json({
            ok: false,
            status: 'error',
            message: 'Idempotency-Key header is required',
        });
    }

    if (!fromAccountId || !toAccountId || !amount) {
        return res.status(400).json({
            ok: false,
            status: 'error',
            message: 'Missing required fields',
        });
    }

    try{
        const result = await createTransactionRequest(fromAccountId, toAccountId, amount, idempotencyKey);

        if (result.status === 'accepted'){
            return res.status(202).json(result);
        } else if (result.status === 'pending') {
            return res.status(202).json(result);
        } else if (result.status === 'completed'){
            return res.status(200).json(result);
        }
    } catch (error){
        if (error.type === 'DuplicateIdempotencyKeyError') {
            return res.status(409).json({
                ok: false,
                status: 'conflict',
                message: 'Duplicate request: this idempotency key has already been used.'
            });
        }

        console.error('Error in createTransaction Controller: ', error);
        return res.status(500).json({
            ok: false,
            status: 'error',
            message: 'An internal server error occurred.',
        });
    }
};

module.exports = {
    createTransactionController: createTransactionController,
}