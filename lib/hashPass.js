const crypto = require('crypto')

module.exports = (password) => {
    let hashing = crypto 
        .createHmac('sha256', 'yukbisayuk')
        .update(password)
        .digest('hex')
    return hashing
}