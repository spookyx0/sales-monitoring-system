-- ============================================
-- SALES MONITORING SYSTEM
-- Complete Database Schema + Sample Data
-- MySQL 8.0 CE - For MySQL Workbench
-- ============================================

-- Step 1: Create and Select Database
CREATE DATABASE IF NOT EXISTS sales_monitoring;
USE sales_monitoring;

-- Step 2: Drop existing tables (for clean installation)
DROP TABLE IF EXISTS stock_adjustments;
DROP TABLE IF EXISTS audits;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS admins;

-- ============================================
-- TABLE CREATION
-- ============================================

-- Admins Table
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items Table
CREATE TABLE items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  item_number VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  qty_in_stock INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  purchase_price DECIMAL(12,2) DEFAULT 0.00,
  selling_price DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('active','inactive') DEFAULT 'active',
  image_url VARCHAR(1024),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_number (item_number),
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_low_stock (qty_in_stock, reorder_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Table
CREATE TABLE sales (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_number VARCHAR(100) UNIQUE,
  admin_id INT,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sale_number (sale_number),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at),
  INDEX idx_payment_method (payment_method),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sale Items Table
CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  price_at_sale DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  INDEX idx_sale_id (sale_id),
  INDEX idx_item_id (item_id),
  FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audits Table
CREATE TABLE audits (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  action VARCHAR(50),
  resource VARCHAR(50),
  resource_id INT NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses Table
CREATE TABLE expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  date DATE NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  receipt_url VARCHAR(1024),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_date (date),
  INDEX idx_category (category),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Adjustments Table
CREATE TABLE stock_adjustments (
  adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  admin_id INT,
  change_amount INT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_item_id (item_id),
  INDEX idx_admin_id (admin_id),
  FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert Admin User (password: admin123)
-- Bcrypt hash for "admin123"
INSERT INTO admins (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@salesmonitor.com', '$2a$12$qAhCdgBN1xE9OCfzXRnacOEyNaDQQMhOxhsrWVRwWsF3LggtU1o8G', 'System Administrator', 'admin'),
('manager', 'manager@salesmonitor.com', '$2a$12$cJKLp4jLnirR68xQwUpC2u.qmw2Hg5OXXSk47BnJ5Y1e4bVjBSdcC', 'Store Manager', 'admin');

-- Insert Sample Items
INSERT INTO items (item_number, name, description, category, sku, barcode, qty_in_stock, reorder_level, purchase_price, selling_price, status) VALUES
('ITM001', 'Laptop Pro 15"', 'High-performance laptop with 16GB RAM', 'Electronics', 'LP-15-001', '1234567890123', 45, 10, 999.99, 1299.99, 'active'),
('ITM002', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 'Accessories', 'WM-001', '1234567890124', 8, 20, 15.00, 29.99, 'active'),
('ITM003', 'USB-C Cable 2m', 'High-speed USB-C charging cable', 'Accessories', 'UC-2M-001', '1234567890125', 150, 50, 5.00, 12.99, 'active'),
('ITM004', 'Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX switches', 'Accessories', 'MK-RGB-001', '1234567890126', 32, 15, 55.00, 89.99, 'active'),
('ITM005', 'Monitor 27" 4K', '27-inch 4K IPS monitor', 'Electronics', 'MON-27-4K', '1234567890127', 5, 10, 250.00, 349.99, 'active'),
('ITM006', 'Webcam HD', '1080p HD webcam with microphone', 'Electronics', 'WC-HD-001', '1234567890128', 25, 8, 35.00, 59.99, 'active'),
('ITM007', 'Desk Lamp LED', 'Adjustable LED desk lamp', 'Office', 'DL-LED-001', '1234567890129', 40, 12, 18.00, 34.99, 'active'),
('ITM008', 'Phone Case', 'Protective phone case for iPhone', 'Accessories', 'PC-IPH-001', '1234567890130', 100, 30, 8.00, 19.99, 'active'),
('ITM009', 'Bluetooth Speaker', 'Portable Bluetooth speaker', 'Electronics', 'BS-PORT-001', '1234567890131', 22, 10, 28.00, 49.99, 'active'),
('ITM010', 'External SSD 1TB', '1TB external solid state drive', 'Electronics', 'SSD-1TB-001', '1234567890132', 18, 8, 75.00, 129.99, 'active'),
('ITM011', 'Notebook A4', 'Professional lined notebook', 'Stationery', 'NB-A4-001', '1234567890133', 200, 50, 2.50, 5.99, 'active'),
('ITM012', 'Pen Set', 'Set of 10 ballpoint pens', 'Stationery', 'PS-10-001', '1234567890134', 300, 100, 3.00, 7.99, 'active'),
('ITM013', 'Headphones Wireless', 'Over-ear wireless headphones with ANC', 'Electronics', 'HP-WL-ANC', '1234567890135', 15, 8, 85.00, 149.99, 'active'),
('ITM014', 'Mouse Pad XL', 'Extra large gaming mouse pad', 'Accessories', 'MP-XL-001', '1234567890136', 60, 20, 10.00, 24.99, 'active'),
('ITM015', 'Tablet Stand', 'Adjustable aluminum tablet stand', 'Accessories', 'TS-ALU-001', '1234567890137', 35, 12, 12.00, 29.99, 'active');

-- Insert Sample Sales
INSERT INTO sales (sale_number, admin_id, total_amount, tax_amount, discount_amount, payment_method, created_at) VALUES
('SALE-20241001-001', 1, 1329.98, 106.40, 0.00, 'Credit Card', '2024-10-01 10:30:00'),
('SALE-20241001-002', 1, 89.99, 7.20, 10.00, 'Cash', '2024-10-01 14:15:00'),
('SALE-20241002-001', 2, 42.97, 3.44, 0.00, 'Debit Card', '2024-10-02 09:20:00'),
('SALE-20241003-001', 1, 349.99, 28.00, 0.00, 'Credit Card', '2024-10-03 11:45:00'),
('SALE-20241003-002', 1, 179.97, 14.40, 20.00, 'Cash', '2024-10-03 16:30:00'),
('SALE-20241004-001', 2, 59.99, 4.80, 0.00, 'Credit Card', '2024-10-04 10:00:00'),
('SALE-20241005-001', 1, 1299.99, 104.00, 0.00, 'Credit Card', '2024-10-05 13:20:00'),
('SALE-20241006-001', 1, 269.97, 21.60, 0.00, 'Debit Card', '2024-10-06 15:45:00'),
('SALE-20241007-001', 2, 129.99, 10.40, 15.00, 'Cash', '2024-10-07 11:30:00'),
('SALE-20241008-001', 1, 449.97, 36.00, 0.00, 'Credit Card', '2024-10-08 14:10:00');

-- Insert Sale Items
INSERT INTO sale_items (sale_id, item_id, quantity, price_at_sale, subtotal) VALUES
(1, 1, 1, 1299.99, 1299.99),
(1, 2, 1, 29.99, 29.99),
(2, 4, 1, 89.99, 89.99),
(3, 3, 3, 12.99, 38.97),
(3, 11, 2, 5.99, 11.98),
(4, 5, 1, 349.99, 349.99),
(5, 13, 1, 149.99, 149.99),
(5, 6, 1, 59.99, 59.99),
(6, 6, 1, 59.99, 59.99),
(7, 1, 1, 1299.99, 1299.99),
(8, 10, 2, 129.99, 259.98),
(8, 14, 1, 24.99, 24.99),
(9, 10, 1, 129.99, 129.99),
(10, 9, 3, 49.99, 149.97),
(10, 15, 2, 29.99, 59.98),
(10, 7, 4, 34.99, 139.96);

-- Insert Sample Expenses
INSERT INTO expenses (admin_id, date, category, amount, notes, created_at) VALUES
(1, '2024-10-01', 'Rent', 2500.00, 'Monthly store rent', '2024-10-01 09:00:00'),
(1, '2024-10-01', 'Utilities', 450.00, 'Electric bill - September', '2024-10-01 09:15:00'),
(1, '2024-10-02', 'Supplies', 230.50, 'Office supplies and cleaning materials', '2024-10-02 10:30:00'),
(2, '2024-10-03', 'Salaries', 4200.00, 'Staff salaries - October', '2024-10-03 08:00:00'),
(1, '2024-10-04', 'Marketing', 680.00, 'Social media ads campaign', '2024-10-04 11:20:00'),
(1, '2024-10-05', 'Internet', 89.99, 'Monthly internet service', '2024-10-05 09:30:00'),
(2, '2024-10-07', 'Maintenance', 350.00, 'AC unit maintenance', '2024-10-07 14:00:00'),
(1, '2024-10-10', 'Supplies', 125.75, 'Packaging materials', '2024-10-10 10:45:00'),
(1, '2024-10-12', 'Insurance', 420.00, 'Monthly business insurance', '2024-10-12 09:00:00'),
(2, '2024-10-15', 'Other', 95.50, 'Miscellaneous expenses', '2024-10-15 15:30:00');

-- Insert Sample Audit Logs
INSERT INTO audits (admin_id, action, resource, resource_id, before_state, after_state, ip_address, created_at) VALUES
(1, 'CREATE', 'items', 1, NULL, '{"item_number":"ITM001","name":"Laptop Pro 15","qty_in_stock":45}', '192.168.1.100', '2024-09-25 10:00:00'),
(1, 'CREATE', 'items', 2, NULL, '{"item_number":"ITM002","name":"Wireless Mouse","qty_in_stock":8}', '192.168.1.100', '2024-09-25 10:05:00'),
(2, 'UPDATE', 'items', 2, '{"qty_in_stock":10}', '{"qty_in_stock":8}', '192.168.1.101', '2024-09-26 11:20:00'),
(1, 'SALE', 'sales', 1, NULL, '{"sale_number":"SALE-20241001-001","total_amount":1329.98}', '192.168.1.100', '2024-10-01 10:30:00'),
(1, 'EXPENSE', 'expenses', 1, NULL, '{"date":"2024-10-01","category":"Rent","amount":2500.00}', '192.168.1.100', '2024-10-01 09:00:00');

-- Update inventory quantities (simulate sales)
UPDATE items SET qty_in_stock = qty_in_stock - 2 WHERE item_id = 1;
UPDATE items SET qty_in_stock = qty_in_stock - 1 WHERE item_id = 2;
UPDATE items SET qty_in_stock = qty_in_stock - 3 WHERE item_id = 3;
UPDATE items SET qty_in_stock = qty_in_stock - 1 WHERE item_id = 4;
UPDATE items SET qty_in_stock = qty_in_stock - 1 WHERE item_id = 5;
UPDATE items SET qty_in_stock = qty_in_stock - 2 WHERE item_id = 6;
UPDATE items SET qty_in_stock = qty_in_stock - 4 WHERE item_id = 7;
UPDATE items SET qty_in_stock = qty_in_stock - 3 WHERE item_id = 9;
UPDATE items SET qty_in_stock = qty_in_stock - 4 WHERE item_id = 10;
UPDATE items SET qty_in_stock = qty_in_stock - 2 WHERE item_id = 11;
UPDATE items SET qty_in_stock = qty_in_stock - 1 WHERE item_id = 13;
UPDATE items SET qty_in_stock = qty_in_stock - 1 WHERE item_id = 14;
UPDATE items SET qty_in_stock = qty_in_stock - 2 WHERE item_id = 15;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables created
SHOW TABLES;

-- Verify row counts
SELECT 'Admins' as Table_Name, COUNT(*) as Row_Count FROM admins
UNION ALL SELECT 'Items', COUNT(*) FROM items
UNION ALL SELECT 'Sales', COUNT(*) FROM sales
UNION ALL SELECT 'Sale Items', COUNT(*) FROM sale_items
UNION ALL SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL SELECT 'Audits', COUNT(*) FROM audits;

-- Check low stock items
SELECT 
    item_number, 
    name, 
    qty_in_stock, 
    reorder_level,
    (reorder_level - qty_in_stock) as shortage
FROM items 
WHERE qty_in_stock <= reorder_level
ORDER BY shortage DESC;

-- Check October revenue
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_sale_amount
FROM sales 
WHERE MONTH(created_at) = 10 AND YEAR(created_at) = 2024
GROUP BY DATE_FORMAT(created_at, '%Y-%m');

-- Check October expenses by category
SELECT 
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM expenses 
WHERE MONTH(date) = 10 AND YEAR(date) = 2024
GROUP BY category
ORDER BY total_amount DESC;

-- Top selling items
SELECT 
    i.item_number,
    i.name,
    SUM(si.quantity) as units_sold,
    SUM(si.subtotal) as total_revenue
FROM sale_items si
JOIN items i ON si.item_id = i.item_id
JOIN sales s ON si.sale_id = s.sale_id
WHERE MONTH(s.created_at) = 10 AND YEAR(s.created_at) = 2024
GROUP BY i.item_id, i.item_number, i.name
ORDER BY units_sold DESC
LIMIT 10;

-- Monthly profit calculation
SELECT 
    'October 2024' as period,
    COALESCE((SELECT SUM(total_amount) FROM sales WHERE MONTH(created_at) = 10 AND YEAR(created_at) = 2024), 0) as revenue,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE MONTH(date) = 10 AND YEAR(date) = 2024), 0) as expenses,
    COALESCE((SELECT SUM(total_amount) FROM sales WHERE MONTH(created_at) = 10 AND YEAR(created_at) = 2024), 0) - 
    COALESCE((SELECT SUM(amount) FROM expenses WHERE MONTH(date) = 10 AND YEAR(date) = 2024), 0) as net_profit;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ Database setup complete!' as Status,
       'Username: admin, Password: admin123' as Login_Info,
       'Run backend with: npm run dev' as Next_Step;