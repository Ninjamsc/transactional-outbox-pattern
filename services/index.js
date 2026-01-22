const userService = require("./userService");
const accountService = require("./accountService");
const transactionRequestService = require("./transactionRequest");

module.exports = {
    ...userService,
    ...accountService,
    ...transactionRequestService,
};