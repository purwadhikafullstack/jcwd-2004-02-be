const{dbCon} = require('../connections')

const crypto = require(('crypto')) 
const hashPass = require('../lib/hashpass')
 

module.exports = {
    loginService : async(data) => {
        let{email,password} = data
        let conn,sql
       
        try { 
        conn = await dbCon.promise().getConnection()
        password = hashPass(password) 

        sql = `select * from users where email=? and password=?`
        let[result] = await conn.query(sql,[email,password])
        console.log(result)
        if (!result.length){
            throw {message: 'users not found'}
        }  

        // let dataToken = {
        //     id: result[0].id,
        //     username: result[0].username
        // } 
        // let tokenAccess = createJwtAccess(dataToken)

        conn.release() 
        return {success: true, data:result[0]}

        // res.set('x-access-token', tokenAccess)
        // return res.status(200).send(result[0])
    } catch (error) {
        conn.release()
        console.log(error) 
        throw new Error (error.message||error)
    }
    }, 
    
}