const express = require("express");
const { checkDBConnection } = require("./db/index");
const { getHealthStatus } = require("./controllers/healthController");
const dotenv = require("dotenv");
const cors = require("cors");
const apiRoutes = require("./routes/index");
dotenv.config();

PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors());
0;

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Distributed booking ledger is running" });
});

const startServer = async () => {
  const isDbStarted = await checkDBConnection();

  if (!isDbStarted) {
    console.error("Failed to connect to Database. Exiting Server Startup");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
