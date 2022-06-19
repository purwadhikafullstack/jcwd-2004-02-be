const mysql = require ('mysql2') 


const dbCon = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'andhika1997',
    database: 'finalproject-e-commerce',
    connectionLimit: 10,
    port: 3306 
}) 

dbCon.getConnection((err,conn)=>{
    if (err){
        console.log('error connecting:' + err.stack) 
        return
    } 
    console.log(`connected as id` + conn.threadId) 
    conn.release()
}) 

module.exports = dbCon

