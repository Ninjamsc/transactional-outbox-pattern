const { validate: isUuid } = require("uuid");
const accountService = require('../services/accountService');

const getAccountDetailsController = async (req, res) => {
    const { id } = req.params;

    if (!isUuid(id)) {
        return res.status(404).json({
            success: false,
            message: 'Account not found.',
        });
    }

    try{
        const account = await accountService.getAccountDetails(id);

        if (account) {
            res.status(200).json({
                success: true,
                message: 'Account details retrieved successfully.',
                data: account,
            });
        } else{
            res.status(404).json({
                success: false,
                message: 'Account not found.',
            });
        }
    } catch (error){
        console.error('Error in getAccountDetailsController:', error);

        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while retrieving account details.',
        });
    }
};

module.exports = {
    getAccountDetailsController: getAccountDetailsController,
};