const expensesService = require('../services/expenses.service');
const auditsService = require('../services/audits.service');

const createExpense = async (req, res, next) => {
  try {
    const expense = await expensesService.createExpense(req.body, req.user.id);
    await auditsService.log(req.user.id, 'CREATE', 'expenses', expense.expense_id, null, req.body, req.ip);
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, category, search } = req.query;
    const expenses = await expensesService.getExpenses({ page, limit, startDate, endDate, category, search });
    res.json({ success: true, data: expenses });
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const beforeState = await expensesService.getExpenseById(req.params.id);
    const expense = await expensesService.updateExpense(req.params.id, req.body);
    await auditsService.log(req.user.id, 'UPDATE', 'expenses', parseInt(req.params.id), beforeState, req.body, req.ip);
    res.json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};


module.exports = { createExpense, getExpenses, updateExpense };