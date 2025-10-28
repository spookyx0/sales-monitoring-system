const itemsService = require('../services/items.service');
const auditsService = require('../services/audits.service');

const getItems = async (req, res, next) => {
  try {
    // Destructure all expected query params here
    const { page, limit, search, status, lowStock, sortBy, sortOrder } = req.query;
    const items = await itemsService.getItems({ page, limit, search, status, lowStock, sortBy, sortOrder });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};
const getItem = async (req, res, next) => {
  try {
    const item = await itemsService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found', status: 404 } });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const item = await itemsService.createItem(req.body);
    await auditsService.log(req.user.id, 'CREATE', 'items', item.item_id, null, req.body, req.ip);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const beforeState = await itemsService.getItemById(req.params.id);
    const item = await itemsService.updateItem(req.params.id, req.body);
    await auditsService.log(req.user.id, 'UPDATE', 'items', parseInt(req.params.id), beforeState, req.body, req.ip);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const beforeState = await itemsService.getItemById(req.params.id);
    await itemsService.deleteItem(req.params.id);
    await auditsService.log(req.user.id, 'DELETE', 'items', parseInt(req.params.id), beforeState, null, req.ip);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};

const restoreItem = async (req, res, next) => {
  try {
    const beforeState = await itemsService.getItemById(req.params.id);
    await itemsService.restoreItem(req.params.id);
    await auditsService.log(req.user.id, 'RESTORE', 'items', parseInt(req.params.id), beforeState, null, req.ip);
    res.json({ success: true, message: 'Item restored' });
  } catch (err) {
    next(err);
  }
};


module.exports = { getItems, 
  getItem, createItem, 
  updateItem, deleteItem, restoreItem };