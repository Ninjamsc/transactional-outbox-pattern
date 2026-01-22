const redis = require('redis');
const dotenv = require("dotenv");
dotenv.config();

const redisClient = redis.createClient({ url: process.env.REDIS_URI});

redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('ready', () => console.log('Redis client is ready'));
redisClient.on('error', (err) => console.error('Redis client error:', err.message));
redisClient.on('onEnd', () => console.log('Redis client connection ended.'));

(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
})();

module.exports = {
    redisClient: redisClient,
};