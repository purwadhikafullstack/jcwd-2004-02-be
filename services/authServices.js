const{dbCon} = require('../connections')
const crypto = require(('crypto')) 
const hashPass = require('../lib/hashpass')


module.exports = {
    registerService: async (data) =>{
        let {name,email,password} = data
        let conn,sql 
        try {
            conn = await dbCon.promise().getConnection()
            let regex = new RegExp(/ /g)
            if(regex.test(name)){
                throw{message: 'ada spasi'}
            } 
            await conn.beginTransaction()
            sql = `select id from users where email = ?`
            let [result] = await conn.query(sql, [email])
            if (result.length){
                throw {message: 'email already used'}
            } 
            sql = `insert into users set ?`
            let insertData = {
                name, 
                email,
                password: hashPass(password), 
                is_verified: 0
            } 
            let [result1] = await conn.query(sql,insertData)
            sql = `select id,name,is_verified,email from users where id = ?`
            let [userData] = await conn.query(sql,[result1.insertId])
            await conn.commit()
            conn.release()
            return {success: true, data: userData[0]}
        } catch (error) { 
            conn.rollback()
            conn.release()
            console.log(error)
            throw new Error (error.message || error)
            // return res.status(500).send({message:error.message || error})

        }
    }
}