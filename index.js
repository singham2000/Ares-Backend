const express = require("express");
const cors = require("cors");
const Log = require("./src/models/logModel.js");
const errorMiddleware = require("./src/middlewares/error.js");
const connectDB = require("./src/config/database.js");
const dotenv = require("dotenv");
const morgan = require("morgan");
const app = express();

dotenv.config({ path: "./src/config/.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE", "PUT"] }));

connectDB();
app.use(morgan("dev"));

app.use((req, res, next) => {
  const logEntry = new Log({ message: `${req.method} ${req.url}` });

  logEntry
    .save()
    .then(() => next())
    .catch((err) => {
      console.error("Error saving log:", err);
      next();
    });
});

const userRoute = require("./src/routes/userRoute");
const adminRoute = require("./src/routes/adminRoute");
const atheleteRoute = require("./src/routes/athleteRoute");

app.use("/api/doctor", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/athlete", atheleteRoute);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

try {
  app.listen(process.env.PORT, () => {
    console.log("App is listening on ", process.env.PORT);
  });
} catch (e) {
  console.log("Hello-JS");
}

app.use(errorMiddleware);
