const {dbCon} = require('../connections')  

module.exports = {
    salesReport: async (req, res) => {
        let conn, sql 

        try {
            conn = dbCon.promise().getConnection()

            // get sisa stock
            sql = `select sum(stock) as total_stock from stock`
            let [sisaStock] = await conn.query(sql) 

            // get pesanan baru 
            sql = `select count(id) from transaction where status = 'diproses'`
            let [pesananBaru] = await (await conn).query(sql) 

            // get dibatalkan 
            sql = `select `

        } catch (error) {
            
        }
    }
}