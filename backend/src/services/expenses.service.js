const db = require('../db');

const createExpense = async (data, adminId) => {
  const { date, category, amount, notes, receipt_url } = data;
  
  const [result] = await db.query(
    `INSERT INTO expenses (admin_id, date, category, amount, notes, receipt_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, date, category, amount, notes, receipt_url || null]
  );

  return { expense_id: result.insertId, ...data };
};

const getExpenses = async ({ page, limit, startDate, endDate, category, search }) => {
  let query = 'SELECT e.*, a.username FROM expenses e LEFT JOIN admins a ON e.admin_id = a.id WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM expenses e WHERE 1=1';
  const params = [];
  const countParams = [];

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

  if (search) {
    const searchQuery = ' AND e.notes LIKE ?';
    query += searchQuery;
    countQuery += searchQuery;
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
  }

  const offset = (page - 1) * limit;
  query += ' ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [expenses] = await db.query(query, params);
  const [[{ total }]] = await db.query(countQuery, countParams);

  return { expenses, total, page: parseInt(page), limit: parseInt(limit) };
};

const updateExpense = async (id, data) => {
  const [result] = await db.query('UPDATE expenses SET ? WHERE expense_id = ?', [data, id]);
  if (result.affectedRows === 0) {
    throw new Error('Expense not found or no new data to update');
  }
  const [[updatedExpense]] = await db.query('SELECT * FROM expenses WHERE expense_id = ?', [id]);
  return updatedExpense;
};

const getExpenseById = async (id) => {
  const [[expense]] = await db.query('SELECT * FROM expenses WHERE expense_id = ?', [id]);
  return expense;
};

const deleteExpense = async (id) => {
  const [result] = await db.query('DELETE FROM expenses WHERE expense_id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new Error('Expense not found');
  }
  return { success: true, message: 'Expense deleted successfully' };
};

module.exports = { createExpense, getExpenses, updateExpense, getExpenseById, deleteExpense };