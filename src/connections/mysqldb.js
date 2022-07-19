const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB,
  connectionLimit: 10,
  port: process.env.PORT_DB,
});

db.getConnection((err, conn) => {
  if (err) {
    console.log("error");
  }
  console.log(`connected as id ${conn.threadId}`);
});

module.exports = db;
