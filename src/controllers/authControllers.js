const {createJwtAccess} = require('../lib/jwt')  
const {loginService} = require('../services/authService') 
const {dbCon} = require('../connections')
const hashPass = require ('../lib/hashpass')



module.exports = { 
    login: async (req,res) => {
        try {  
            const { 
                data: userData 

            } = await loginService(req.body)  
            
            const dataToken = {
                id: userData.id,
                name: userData.name
            } 
            const tokenAccess = createJwtAccess(dataToken)  
            res.set('x-token-access', tokenAccess)
            return res.status(200).send(userData)
        } catch (error) {
             
           console.log(error) 
           return res.status(500).send({message: error.message || error})
        }
    },
    keeplogin: async(req,res) => {
        const {id} = req.user 
        let conn,sql
        try {
            conn = await dbCon.promise().getConnection()
            sql =`select * from users where id=?`
            let [result] = await conn.query(sql, [id])
            console.log(result)
            conn.release()
            return res.status(200).send(result[0])
        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message||error})
        }
    }
}