const userDao = require("../dao/userDao");

const createUserAndAccount = async (email, password, initialBalance, phoneNumber = null) => {
    // Basic input validation done here for the sake of MVP. Intense validation required afterwards.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format');
    }

    if (!password || password.length < 8){
        throw new Error('Password must be at least 8 characters long');
    }
    
    if (typeof initialBalance !== 'number' || initialBalance < 0){
        throw new Error('Initial balance must be a non-negative number.');
    }

    try{
        const { userId, accountId } = await userDao.createUserAndAccount(
            email,
            password,
            initialBalance,
            phoneNumber
        );

        return { userId, accountId };
    } catch (error){
        console.error('Error in userService.createUserAndAccount: ', error);

        if (error.message === 'User with this email already exists.'){
            throw new Error('A user with this email already exists. Please use a different email');
        }
        
        throw new Error('Failed to create user and account due to an internal server error');
    }
};

module.exports = {
    createUserAndAccount: createUserAndAccount,
};