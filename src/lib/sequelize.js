const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USERNAME,
  process.env.MYSQL_PASS,
  {
    host: "localhost",
    dialect: "mysql",
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: "+07:00",
  }
);

module.exports = sequelize;
