const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const itemsController = require('../controllers/items.controller');

router.use(authenticateToken);

router.get('/', itemsController.getItems);
router.get('/:id', itemsController.getItem);
router.post('/', itemsController.createItem);
router.put('/:id', itemsController.updateItem);
router.delete('/:id', itemsController.deleteItem);
router.put('/:id/restore', itemsController.restoreItem);

module.exports = router;