const db = require('../db');

const createSale = async (data, adminId, ipAddress) => {
  const { items, payment_method, tax_amount = 0, discount_amount = 0 } = data;

  if (!items || items.length === 0) {
    const error = new Error('Sale must contain at least one item');
    error.status = 400;
    throw error;
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.price_at_sale;
    }
    total_amount = total_amount + tax_amount - discount_amount;

    const sale_number = `SALE-${Date.now()}`;

    const [saleResult] = await conn.query(
      `INSERT INTO sales (sale_number, admin_id, total_amount, tax_amount, discount_amount, payment_method)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sale_number, adminId, total_amount, tax_amount, discount_amount, payment_method]
    );

    const sale_id = saleResult.insertId;

    for (const item of items) {
      const subtotal = item.quantity * item.price_at_sale;
      await conn.query(
        `INSERT INTO sale_items (sale_id, item_id, quantity, price_at_sale, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [sale_id, item.item_id, item.quantity, item.price_at_sale, subtotal]
      );

      await conn.query(
        'UPDATE items SET qty_in_stock = qty_in_stock - ? WHERE item_id = ?',
        [item.quantity, item.item_id]
      );
    }

    await conn.query(
      `INSERT INTO audits (admin_id, action, resource, resource_id, after_state, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, 'SALE', 'sales', sale_id, JSON.stringify({ sale_number, total_amount, items }), ipAddress]
    );

    await conn.commit();

    return { sale_id, sale_number, total_amount, tax_amount, discount_amount, payment_method };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getSales = async ({ page, limit, startDate, endDate, search }) => {
  let query = 'SELECT s.*, a.username FROM sales s LEFT JOIN admins a ON s.admin_id = a.id WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM sales s WHERE 1=1';
  const params = [];
  const countParams = [];

  if (search) {
    const searchQuery = ' AND (s.sale_number LIKE ? OR a.username LIKE ?)';
    query += searchQuery;
    countQuery += searchQuery;
    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
  }

  if (startDate) {
    query += ' AND DATE(s.created_at) >= ?';
    params.push(startDate);
    countQuery += ' AND DATE(s.created_at) >= ?';
    countParams.push(startDate);
  }

  if (endDate) {
    query += ' AND DATE(s.created_at) <= ?';
    params.push(endDate);
    countQuery += ' AND DATE(s.created_at) <= ?';
    countParams.push(endDate);
  }

  const offset = (page - 1) * limit;
  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [sales] = await db.query(query, params);

  for (const sale of sales) {
    const [items] = await db.query(
      `SELECT si.*, i.name FROM sale_items si 
       LEFT JOIN items i ON si.item_id = i.item_id 
       WHERE si.sale_id = ?`,
      [sale.sale_id]
    );
    sale.items = items;
  }

  const [[{ total }]] = await db.query(countQuery, countParams);

  return { sales, total, page: parseInt(page), limit: parseInt(limit) };
};

const getSale = async (id) => {
  const [rows] = await db.query(
    'SELECT s.*, a.username FROM sales s LEFT JOIN admins a ON s.admin_id = a.id WHERE s.sale_id = ?',
    [id]
  );

  if (rows.length === 0) return null;

  const sale = rows[0];

  const [items] = await db.query(
    `SELECT si.*, i.name, i.item_number FROM sale_items si 
     LEFT JOIN items i ON si.item_id = i.item_id 
     WHERE si.sale_id = ?`,
    [id]
  );

  sale.items = items;
  return sale;
};

module.exports = { createSale, getSales, getSale };