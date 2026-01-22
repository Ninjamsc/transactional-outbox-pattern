const userController = require("./userController");
const healthController = require("./healthController");
const accountController = require("./accountController");

module.exports = {
    ...userController,
    ...healthController,
    ...accountController,
};