const express = require('express')
const {verifyTokenAccess, verifyTokenEmail} = require('../lib/verifyToken') 
const Router = express.Router()
const {authControllers} = require ('../controllers') 
const {register, sendEmailVerified, accountVerified, changePassword} = authControllers  
const verifyLastToken = require ('../lib/verifyLastToken')



Router.post('/register', register) 
Router.get('/verified',verifyTokenEmail,verifyLastToken,accountVerified) 
Router.post('/sendemail-verified', sendEmailVerified)  


module.exports = Router
