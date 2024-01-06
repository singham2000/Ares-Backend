const express = require("express");
const cors = require('cors');
const errorMiddleware = require('./src/middlewares/error.js');
const connectDB = require("./src/config/database.js");
const dotenv = require("dotenv");
const app = express();

dotenv.config({ path: "./src/config/config.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE", "PUT"] }));
connectDB();


const userRoute = require("./src/routes/userRoute");
const adminRoute = require('./src/routes/adminRoute.js');

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

try {
  app.listen(process.env.PORT, () => {
    console.log("App is listening on ", process.env.PORT);
  });
} catch (e) {
  console.log('Hello-JS');
}


app.use(errorMiddleware);
