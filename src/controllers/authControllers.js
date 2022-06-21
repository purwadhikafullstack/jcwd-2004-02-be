const {createJwtAccess, createJwtEmail} = require('../lib/jwt')  
const {loginService, registerService} = require('../services/authService') 
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
    }, 
    changePassword: async(req,res) => {
        const {id} = req.user 
        const {newPassword,oldPassword} = req.body 
        console.log(id)
        let conn,sql

        try {
            conn = await dbCon.promise().getConnection()
            sql = `select password from users where id = ? and password=?`
            let [result] = await conn.query(sql,[id,hashPass(oldPassword)])
            console.log(result)
            if (!result.length){
                throw {message: 'Incorrect Password'}
            } 
            
            sql = `update users set ? where id =?` 
            let updateNewPass = { 
                password: hashPass(newPassword)
            } 

            await conn.query(sql, [updateNewPass, id]) 
            
            // conn.commit()
            conn.release()
            return res.status(200).send({message: 'reset password success'})
        } catch (error) { 
            console.log(error)
            return res.status(500).send({message: error.message || error})
        }
    }, 
    register: async (req,res) => {
        try {
            const {
                data: userData,
               
            } = await registerService(req.body)  

            let timecreated = new Date().getTime() 

            const dataToken = {
                id: userData.id, 
                name: userData.name,
            }  

            let sukses = myCache.set(userData.id, dataToken, 10*60) 
            if(!sukses){
                throw {message: 'error caching'}
            }

            const tokenAccess = createJwtAccess(dataToken)
            const tokenEmail= createJwtEmail(dataToken) 
            const host = 
                process.env.NODE_ENV === 'production' 
                    ? 'http://namadomainfe' 
                    : 'http://localhost:3000'
                const link = `${host}/verified/${tokenEmail}` 
                let filePath = path.resolve(__dirname,'../templates/emailTemplate.html')
                let htmlString = fs.readFileSync(filePath, 'utf-8') 
                console.log(htmlString) 
                const template = handlebars.compile(htmlString)
                const htmlToEmail = template ({
                    name : userData.name,  
                    link
                }) 
                transporter.sendMail({
                    from: 'Healthymed Email Verification<andhikapraset@gmail.com>',
                    to: 'andhikapraset@gmail.com',
                    subject: 'Healthymed',
                    html: htmlToEmail,
                })  
                res.set('x-token-access', tokenAccess)  
                console.log(transporter.sendMail)
                return res.status(200).send(userData)
        } catch (error) { 
            console.log(error)
            return res.status(500).send({message: error.message || error})
        }
    }, 
    accountVerified: async (req,res) => {
        const {id} = req.user
        let conn,sql
        try {
            conn = await dbCon.promise().getConnection() 
            await conn.beginTransaction() 
            sql = `select id from users where id =? and is_verified = 1`
            let [userVerified] = await conn.query(sql, [id]) 
            console.log(req.user) 
            if(userVerified.length){
                throw {message: 'kan udah verified ngapain di klik lagi'}
            }
            sql = `update users set ? where id = ?` 
            let updateData = {
                is_verified: 1
            } 
            await conn.query(sql, [updateData,id]) 
            sql = `select * from users where id= ?` 
            let [result] = await conn.query(sql,[id]) 
            await conn.commit()
            
            return res.status(200).send(result[0])
        } catch (error) {
            conn.rollback()
            
            console.log(error)
            return res.status(500).send({message: error.message ||error})
        }
    }, 
    sendEmailVerified: async (req,res) => {
        const {id,email,name} = req.body 
        try {
           const dataToken = {
               id:id,
               name: name
           }  
           const tokenEmail = createJwtEmail(dataToken) 
           const host = 
            process.env.NODE_ENV === 'production' 
                ? 'http://namadomainfe'
                : 'http://localhost:3000'
            const link = `${host}/verified/${tokenEmail}` 
            let filepath = path.resolve(__dirname, '../templates/emailTemplate.html')
            let htmlString = fs.readFileSync(filepath,'utf-8')
            const template = handlebars.compile(htmlString)
            const htmlToEmail = template({
                name: name,
                link,
            }) 
            console.log(htmlToEmail)
            transporter.sendMail({
                from: 'Healthymed Email Verification<andhikapraset@gmail.com',   
                to: `andhikapraset@gmail.com`, 
                subject: 'Link Email Verification', 
                hmtl: htmlToEmail
            }) 
            return res.status(200).send({message: 'berhasil kirim email'})
        } catch (error) {
            console.log(error)
            return res.status(200).send({message: error.message||error})
        }
    },
}