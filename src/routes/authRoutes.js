const express = require('express')
const {verifyTokenAccess} = require('../lib/verifyToken') 
const Router = express.Router()
const {authControllers} = require ('../controllers') 
const { login, keeplogin, changePassword} = authControllers  



Router.post('/login', login) 
Router.get('/keepLogin',verifyTokenAccess,keeplogin)  
Router.put('/changePassword', verifyTokenAccess, changePassword) 



module.exports = Router
