const bcrypt = require('bcrypt') 

module.exports.bcryptHash = async (password) => {
    try {
        let hash = await bcrypt.hash(password,5) 
        return hash
    } catch (error) {
        console.log(error) 
        return null
    }
} 

module.exports.bcryptCompare = async (inputPass,hasilhashing) => {
    try {
        let match = await bcrypt.compare (inputPass,hasilhashing) 
        return match
    } catch (error) {
        return false
    }
}