const { dbCon } = require("../connection");
const db = require("../connection/mysqldb");
const { json } = require("body-parser");

module.exports = {
  fetchDaftarProduk: async (req, res) => {
    let conn, sql;
    let { search, page, limit, category } = req.query;

    if (!category) {
      category = 0;
    } else {
      category = parseInt(category);
    }

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    if (!search) {
      search = "";
    }

    let offset = page * parseInt(limit);

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get tabel product & category & stock
      sql = `select product.id, name, sell_price, buy_price, unit, med_number, bpom_number, category_id, json_arrayagg(category_name) as categories,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      inner join category_product on product.id = category_product.product_id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      where product.name like '%${search}%'  and category_product.category_id =${category} or not exists (select null from category_product where category_id= ${category}) 
      group by product.id LIMIT ${dbCon.escape(offset)}, ${dbCon.escape(
        limit
      )}`;
      let [result] = await conn.query(sql);

      // count total product
      sql = `select count (*) as total_product from product`;
      let [totalProduct] = await conn.query(sql);

      await conn.commit();
      conn.release();
      res.set("x-total-product", totalProduct[0].total_product);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  getComponentObat: async (req, res) => {
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `select id, name from category`;
      let [category] = await conn.query(sql);

      await conn.commit();
      return res.status(200).send(category);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
