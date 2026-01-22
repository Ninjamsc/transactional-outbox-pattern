const userService = require("../services/userService");

const createUserController = async (req, res) => {
    const { email, password, initialBalance, phoneNumber } = req.body;

    if (!email || !password || !initialBalance === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: email, password, and initialBalance are mandatory.',
        });
    }

    if (typeof initialBalance !== 'number'){
        return res.status(400).json({
            success: false,
            message: 'initialBalance must be a number.',
        })
    }

    try{
        const { userId, accountId } = await userService.createUserAndAccount(
            email,
            password,
            initialBalance,
            phoneNumber,
        );

        res.status(201).json({
            success: true,
            message: 'User and account created successfully.',
            data: {
                userId,
                accountId,
                email, // Echo back the email for confirmation
            },
        });
    } catch (error){
        console.log('Error in createUserController:', error);

        if (error.message.includes('Invalid email format') || 
            error.message.includes('Password must be at least 8 characters long') ||
            error.message.includes('Initial balance must be a non-negative number')) {
        return res.status(400).json({ // 400 Bad Request for client-side input errors
            success: false,
            message: error.message,
        });
        } else if (error.message.includes('A user with this email already exists.')) {
        return res.status(409).json({ // 409 Conflict for resource conflict (duplicate email)
            success: false,
            message: error.message,
        });
        } else {
        // For any other unexpected errors, return a generic 500 Internal Server Error.
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while creating the user and account.',
        });
        }
    }
};

module.exports = {
    createUserController: createUserController,
};