const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const itemsRoutes = require('./routes/items.routes');
const salesRoutes = require('./routes/sales.routes');
const auditsRoutes = require('./routes/audits.routes');
const expensesRoutes = require('./routes/expenses.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Enable CORS for all routes and all origins
// This also handles pre-flight OPTIONS requests
app.use(cors({
  origin: '*', // In production, you should restrict this to your frontend's domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/expenses', expensesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Sales Monitoring API is running...');
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;