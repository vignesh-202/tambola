const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "tambola_db",
});

db.connect(err => {
  if (err) console.error(err);
  else console.log("MySQL Connected");
});

module.exports = db;
