const db = require('../db');

const createExpense = async (data, adminId) => {
  const { date, category, amount, notes, receipt_url } = data;
  
  const [result] = await db.query(
    `INSERT INTO expenses (admin_id, date, category, amount, notes, receipt_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, date, category, amount, notes, receipt_url]
  );

  return { expense_id: result.insertId, ...data };
};

const getExpenses = async ({ page, limit, startDate, endDate, category }) => {
  let query = 'SELECT e.*, a.username FROM expenses e LEFT JOIN admins a ON e.admin_id = a.id WHERE 1=1';
  const params = [];

  if (startDate) {
    query += ' AND e.date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND e.date <= ?';
    params.push(endDate);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  const offset = (page - 1) * limit;
  query += ' ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [expenses] = await db.query(query, params);
  const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM expenses WHERE 1=1');

  return { expenses, total, page: parseInt(page), limit: parseInt(limit) };
};

module.exports = { createExpense, getExpenses };