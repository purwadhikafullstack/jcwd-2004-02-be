const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();

let PORT;
process.env.STATUS == "development"
  ? (PORT = process.env.DEV_PORT)
  : (PORT = process.env.PROD_PORT);
const cors = require("cors");
const morgan = require("morgan");

morgan.token("date", function (req, res) {
  return new Date().toString();
});

app.use(morgan(":method :url :res[content-length] - :response-time ms :date"));

app.use(express.json());

app.use(
  cors({
    exposedHeaders: [
      "x-total-product",
      "x-total-count",
      "x-token-access",
      "x-total-transaction",
    ],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const { productRoutes } = require("./src/routes");
const { authRoutes } = require("./src/routes");
const { profileRoutes } = require("./src/routes");
const { prescriptionRoutes } = require("./src/routes");
const { transactionRoutes } = require("./src/routes");

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/profile", profileRoutes);
app.use("/transaction", transactionRoutes);
app.use("/prescription", prescriptionRoutes);
app.use("/transaction", transactionRoutes);

app.listen(PORT, () =>
  console.log(`Server in ${process.env.STATUS} mode, listening on ${PORT}`)
);
