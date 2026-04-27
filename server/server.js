require("dotenv").config();

const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");
const userRoutes = require("./routes/userRoutes");
const messRoutes = require("./routes/messRoutes");
const communityRoutes = require("./routes/communityRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/lost-found", lostFoundRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});