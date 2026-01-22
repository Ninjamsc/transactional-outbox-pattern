const { findAccountById } = require("../dao");

const getAccountDetails = async (accountId) => {
    try{
        const account = await findAccountById(accountId);
        return account;
    } catch (error){
        console.error('Error in accountService.getAccountDetails:', error);
        throw new Error('Failed to retrieve account details.');
    }
};

module.exports = {
    getAccountDetails: getAccountDetails,
};