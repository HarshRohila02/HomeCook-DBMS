require("dotenv").config();

const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");
const userRoutes = require("./routes/userRoutes");
const messRoutes = require("./routes/messRoutes");
const communityRoutes = require("./routes/communityRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const gatepassRoutes = require("./routes/gatepassRoutes");
const shuttleRoutes = require("./routes/shuttleRoutes");
const campusLogsRoutes = require("./routes/campusLogsRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/gatepasses", gatepassRoutes);
app.use("/api/shuttles", shuttleRoutes);
app.use("/api/campus-logs", campusLogsRoutes);
app.use("/api/auth", authRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  return next(err);
});

app.use((req, res) => {
  return res.status(404).json({ message: "API route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});