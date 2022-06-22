const { dbCon } = require("../connections");
const db = require("../connections/mysqldb");
const { json } = require("body-parser");

module.exports = {
  fetchDaftarProduk: async (req, res) => {
    let conn, sql;
    let { search, page, limit, category } = req.query;

    if (category) {
      category = `and category_product.category_id = ${category}`;
    } else {
      category = ``;
    }

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    if (search) {
      search = `and product.name like '%${search}%'`;
    } else {
      search = ``;
    }

    let offset = page * parseInt(limit);

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get tabel product & category & stock
      sql = `select product.id, name, sell_price, buy_price, unit, med_number, bpom_number,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      inner join category_product on product.id = category_product.product_id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      where true ${search} ${category} group by product.id LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [result] = await conn.query(sql);

      sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        let [categories] = await conn.query(sql, element.id);
        result[i].categories = categories;
      }

      // count tabel product & category & stock
      sql = `select count(*) as total_data from (select product.id, name, sell_price, buy_price, unit, med_number, bpom_number,
        (select sum(stock) from stock where product_id = product.id) as total_stock from product
        inner join category_product on product.id = category_product.product_id
        left join (select name as category_name, id from category) as kategori on category_id = kategori.id
        where true ${search} ${category} group by product.id) as table_data`;

      let [totalData] = await conn.query(sql);

      await conn.commit();
      conn.release();
      // console.log(result);
      res.set("x-total-product", totalData[0].total_data);
      console.log(totalData[0].total_data);
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
