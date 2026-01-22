const { redisClient } = require('./redisUtils');

(async () => {
    try {
        // Wait for connection
        await redisClient.connect();
        // Simple set/get test
        await redisClient.set("testKey", "Hello Redis");
        const value = await redisClient.get("testKey");
        console.log("Value from Redis:", value);

        // Close connection
        await redisClient.quit();
    } catch (err) {
        console.error("Redis test failed:", err);
    }
})();
