const salesService = require('../services/sales.service');

const createSale = async (req, res, next) => {
  try {
    const sale = await salesService.createSale(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, search } = req.query;
    const sales = await salesService.getSales({ page, limit, startDate, endDate, search });
    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
};

const getSale = async (req, res, next) => {
  try {
    const sale = await salesService.getSale(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: { message: 'Sale not found', status: 404 } });
    }
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSale, getSales, getSale };