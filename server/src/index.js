require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/tests");
const sessionRoutes = require("./routes/sessions");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "psychlab-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`PsychLab API running at http://127.0.0.1:${PORT}`);
});
