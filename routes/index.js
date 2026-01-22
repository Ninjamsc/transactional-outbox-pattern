const express = require("express");
const { getHealthStatus } = require("../controllers/healthController");
const { createUserController } = require("../controllers/userController");
const { getAccountDetailsController } = require("../controllers/accountController");
const { createTransactionController } = require("../controllers/transactionRequestController");
const router = express.Router();

router.get('/status', getHealthStatus);
router.get('/accounts/:id', getAccountDetailsController);
router.post('/users', createUserController);
router.post('/transactions', createTransactionController);

module.exports = router;