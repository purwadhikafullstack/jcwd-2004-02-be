const express = require('express')
const Router = express.Router()
const {transactionControllers} = require ('../controllers') 
const { getAllAddress, defaultAddress } = require('../controllers/transactionControllers')
const {addToCart, deleteCart, getDataCart, getCities,getProvinces, addAddress,plusCart, minCart,getAddress} = transactionControllers 
const {verifyTokenAccess, verifyTokenEmail} = require('../lib/verifyToken') 


Router.post('/addToCart',verifyTokenAccess, addToCart)  
Router.delete('/deleteCart', verifyTokenAccess, deleteCart) 
Router.get('/getDataCart', verifyTokenAccess, getDataCart ) 
Router.put('/plusCart', verifyTokenAccess, plusCart)
Router.put('/minCart', verifyTokenAccess, minCart)
Router.get('/getCities/:province_id', getCities)
Router.get('/getProvinces', getProvinces)
Router.post('/addAddress',verifyTokenAccess, addAddress)  
Router.get('/getAddress', verifyTokenAccess, getAddress) 
Router.get('/getAllAddress', verifyTokenAccess, getAllAddress)
Router.put('/defaultAddress/', verifyTokenAccess, defaultAddress)

module.exports = Router