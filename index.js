require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
// const db = require("./src/models");

// middleware log
const logMiddleware = (req, res, next) => {
  console.log(req.method, req.url, new Date().toString());
  next();
};

// buat mengijinkan frontend akses backend
app.use(
  cors({
    exposedHeaders: ["x-total-count", "x-token-access"],
  })
);

app.use(express.json());
// buat upload foto dan reserve file
app.use(express.urlencoded({ extended: false }));
app.use(logMiddleware);
app.use(express.static("public"));

const { authRoutes} = require("./src/routes"); 

app.use("/auth", authRoutes);


app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});