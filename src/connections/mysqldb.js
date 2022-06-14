const mysql = require("mysql2");

const dbCon = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "rakan123",
  database: "mydb",
  prt: 3306,
  connectionLimit: 10,
});

dbCon.getConnection((err, conn) => {
  if (err) {
    console.log("error connecting:" + err.stack);
    return;
  }
  console.log("connected as ID" + conn.threadId);
  conn.release();
});

module.exports = dbCon;
