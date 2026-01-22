const userDao = require('./userDao');
const accountDao = require('./accountDao');
const transactionDaoRequest = require("./transactionDaoRequest");

module.exports = {
    ...userDao,
    ...accountDao,
    ...transactionDaoRequest,
};