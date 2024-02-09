const mysql = require("mysql")

//Create MYSQL connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "",
    database: "auth_system"
})

module.exports = pool;
