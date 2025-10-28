import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Package, DollarSign, TrendingUp, AlertTriangle, Users, LogOut, Menu, X, Plus, Edit, Trash2, Search, Calendar, ShoppingCart, Minus, FileText, CheckCircle, XCircle, Loader2, Bell, RotateCw, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import api from './api';

const StatusContext = React.createContext();

function App() {
  const [auth, setAuth] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ isOpen: false, type: '', message: '' });
  const [notifications, setNotifications] = useState([]);

  const showStatus = useCallback((type, message) => {
    setStatus({ isOpen: true, type, message });
  }, []);

  const closeStatus = () => {
    setStatus({ isOpen: false, type: '', message: '' });
  };

  useEffect(() => {
    if (status.isOpen) {
      const timer = setTimeout(() => closeStatus(), 3000);
      return () => clearTimeout(timer);
    }
  }, [status.isOpen]); // useCallback for closeStatus is not needed here

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const admin = await api.getMe();
        if (admin) {
          setAuth({ admin });
        }
      } catch (error) {
        console.error("Auth check failed", error);
        api.logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      // This is a mock implementation. Ideally, this would be a single API call.
      const { items } = await api.getItems({ limit: 1000 });
      const lowStockNotifications = items
        .filter(item => item.qty_in_stock <= item.reorder_level)
        .map(item => ({
          id: `low-stock-${item.item_id}`,
          message: `${item.name} is low on stock (${item.qty_in_stock} left).`,
          type: 'low_stock',
          read: false,
          createdAt: new Date().toISOString(),
        }));
      setNotifications(lowStockNotifications);
    } catch (error) { console.error("Failed to fetch notifications", error); }
  }, []);

  const handleLogin = (authData) => {
    setAuth(authData);
  };

  const handleLogout = () => {
    api.logout();
    setAuth(null);
  };

  useEffect(() => {
    if (auth) fetchNotifications();
  }, [auth, fetchNotifications]);

  return (
    <StatusContext.Provider value={showStatus}>
      {loading ? (
        <div className="flex h-screen items-center justify-center">Loading...</div>
      ) : !auth ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="flex h-screen bg-gray-50">
          <Sidebar open={sidebarOpen} currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar user={auth.admin} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} notifications={notifications} setNotifications={setNotifications} onNavigate={setCurrentPage} />
            
            <main className="flex-1 overflow-y-auto p-6">
              {currentPage === 'dashboard' && <Dashboard />}
              {currentPage === 'inventory' && <Inventory setNotifications={setNotifications} user={auth.admin} />}
              {currentPage === 'sales' && <Sales setNotifications={setNotifications} user={auth.admin} />}
              {currentPage === 'analytics' && <Analytics />}
              {currentPage === 'audits' && <Audits />}
              {currentPage === 'expenses' && <Expenses setNotifications={setNotifications} user={auth.admin} />}
            </main>
          </div>
          {status.isOpen && <StatusModal type={status.type} message={status.message} onClose={closeStatus} />}
        </div>
      )}
    </StatusContext.Provider>
  );
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const showStatus = React.useContext(StatusContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authData = await api.login(username, password);
      onLogin(authData);
      // No success message needed here as the app transitions
    } catch (err) {
      console.error(err);
      showStatus('error', err.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <BarChart3 className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Sales Monitor</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ open, currentPage, onNavigate, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audits', label: 'Audits', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: AlertTriangle }
  ];

  if (!open) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">Sales Monitoring</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function Topbar({ user, onToggleSidebar, notifications, setNotifications, onNavigate }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const notificationsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsRef]);

  const handleNotificationClick = (notification) => {
    if (notification.type === 'low_stock') {
      onNavigate('inventory');
    }
    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationsRef}>
            <button onClick={() => setShowNotifications(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 transition relative">
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20 animate-in fade-in-0 zoom-in-95">
                <div className="p-4 flex justify-between items-center border-b">
                  <h4 className="font-semibold text-gray-800">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-sm text-indigo-600 hover:underline">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <a
                        key={n.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNotificationClick(n); }} className={`block p-4 hover:bg-gray-50 border-b ${!n.read ? 'bg-indigo-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full ${!n.read ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className="text-sm text-gray-700">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 p-8">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-800">{user.full_name}</div>
            <div className="text-xs text-gray-500">Administrator</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
            {user.full_name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesData, itemsData, expensesData] = await Promise.all([
          api.getSales({ limit: 1000 }), // Fetch recent sales
          api.getItems({ limit: 1000 }), // Fetch all items for counts
          api.getExpenses({ limit: 1000 }) // Fetch recent expenses
        ]);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthRevenue = salesData.sales.reduce((sum, sale) => {
          const saleDate = new Date(sale.created_at);
          if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
            return sum + parseFloat(sale.total_amount);
          }
          return sum;
        }, 0);

        const monthExpenses = expensesData.expenses.reduce((sum, expense) => {
            const expenseDate = new Date(expense.date);
            if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
                return sum + parseFloat(expense.amount);
            }
            return sum;
        }, 0);

        const overview = {
          monthRevenue,
          totalItems: itemsData.total,
          lowStockCount: itemsData.items.filter(i => i.qty_in_stock <= i.reorder_level).length,
          monthExpenses,
          revenue: [/* Mock data for trend, needs backend logic */ 12000, 19000, 3000, 5000, 2000, 3000],
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          topItems: salesData.sales.flatMap(s => s.items).reduce((acc, item) => {
            const existing = acc.find(i => i.name === item.name);
            if (existing) {
              existing.qty += item.quantity;
            } else {
              acc.push({ name: item.name, qty: item.quantity });
            }
            return acc;
          }, []).sort((a, b) => b.qty - a.qty).slice(0, 5)
        };

        setData(overview);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Month Revenue"
          value={`PHP ${data.monthRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Items"
          value={data.totalItems}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={data.lowStockCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Month Expenses"
          value={`PHP ${data.monthExpenses.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.revenue.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-indigo-500 rounded-t"
                  style={{ height: `${(val / Math.max(...data.revenue)) * 100}%` }}
                />
                <span className="text-xs text-gray-600">{data.months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {data.topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(item.qty / data.topItems[0].qty) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-8 text-right">{item.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function Inventory({ setNotifications, user }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 9; // Define how many items per page
  const [statusFilter, setStatusFilter] = useState('active');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const showStatus = React.useContext(StatusContext);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };
      const data = await api.getItems(params);
      setItems(data.items);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Failed to fetch items", error);
      showStatus('error', "Failed to fetch items.");
    }
    setLoading(false);
  }, [search, currentPage, showStatus, statusFilter, sortConfig]); // fetchItems depends on 'search' and 'currentPage'

  useEffect(() => {
    fetchItems();
  }, [fetchItems]); // Now fetchItems is a stable dependency

  // Handlers for item creation/update/deletion
  const handleSave = async (itemId, formData) => {
    try {
      if (itemId) {
        await api.updateItem(itemId, formData);
        setNotifications(prev => [{
          id: `update-item-${itemId}-${Date.now()}`,
          message: `${user.full_name} updated item: ${formData.name}.`,
          type: 'item_update',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        showStatus('success', 'Item updated successfully!');
      } else {
        const newItem = await api.createItem(formData);
        showStatus('success', 'Item created successfully!');
        setNotifications(prev => [{
          id: `create-item-${newItem.item_id}-${Date.now()}`,
          message: `${user.full_name} created a new item: ${formData.name}.`,
          type: 'item_create',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
      setShowForm(false);
      fetchItems(); // Refresh list
    } catch (error) {
      console.error("Failed to save item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    const itemToDelete = items.find(i => i.item_id === itemId);
    try {
      await api.deleteItem(itemId);
      setItemToDelete(null); // Close modal
      fetchItems(); // Refresh list
      setNotifications(prev => [{
        id: `delete-item-${itemId}-${Date.now()}`,
        message: `${user.full_name} deleted item: ${itemToDelete.name}.`,
        type: 'item_delete',
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showStatus('success', 'Item deleted successfully.');
    } catch (error) {
      console.error("Failed to delete item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  const handleRestore = async (itemId) => {
    const itemToRestore = items.find(i => i.item_id === itemId);
    try {
      await api.restoreItem(itemId);
      setItemToRestore(null); // Close modal
      fetchItems(); // Refresh list
      setNotifications(prev => [{
        id: `restore-item-${itemId}-${Date.now()}`,
        message: `${user.full_name} restored item: ${itemToRestore.name}.`,
        type: 'item_restore',
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showStatus('success', 'Item restored successfully.');
    } catch (error) {
      console.error("Failed to restore item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 ml-1" />;
    }
    return <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex border border-gray-300 rounded-lg p-1 bg-gray-50">
            {['active', 'inactive', 'all'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <button onClick={() => requestSort('item_number')} className="flex items-center">Item # {getSortIcon('item_number')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <button onClick={() => requestSort('name')} className="flex items-center">Name {getSortIcon('name')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <button onClick={() => requestSort('category')} className="flex items-center">Category {getSortIcon('category')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <button onClick={() => requestSort('qty_in_stock')} className="flex items-center">Stock {getSortIcon('qty_in_stock')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <button onClick={() => requestSort('selling_price')} className="flex items-center">Price {getSortIcon('selling_price')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  <button onClick={() => requestSort('created_at')} className="flex items-center">Date Added {getSortIcon('created_at')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading items...</td></tr>
              ) : items.length > 0 ? (
                items.map(item => (
                  <tr key={item.item_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{item.item_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.qty_in_stock <= item.reorder_level
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.qty_in_stock || 0}
                      </span> 
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">PHP {parseFloat(item.selling_price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {item.status === 'active' ? (
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setItemToRestore(item)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-4">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-center items-center border-t border-gray-200 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Logic to show only a few page numbers around the current page
              const showPage = Math.abs(page - currentPage) < 2 || page === 1 || page === totalPages;
              const showEllipsis = Math.abs(page - currentPage) === 2 && page > 1 && page < totalPages;

              if (showEllipsis) {
                return <span key={`ellipsis-${page}`} className="px-3 py-1 text-sm text-gray-500">...</span>;
              }

              if (showPage) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-lg text-sm ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ItemFormModal
          item={editItem}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-800">Delete Item?</h3>
              <p className="mt-2 text-gray-600">
                Are you sure you want to make{' '}
                <span className="font-semibold">{itemToDelete.name}</span> inactive? It will no longer be available for new sales,
                but will remain in historical records.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(itemToDelete.item_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                >
                  Delete
                </button>
            </div>
          </div>
        </div>
      )}

      {itemToRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 text-center">
              <RotateCw className="w-16 h-16 mx-auto text-green-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-800">Restore Item?</h3>
              <p className="mt-2 text-gray-600">
                Are you sure you want to restore{' '}
                <span className="font-semibold">{itemToRestore.name}</span>? It will become active and available for new sales again.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setItemToRestore(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleRestore(itemToRestore.item_id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors">
                  Restore
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Analytics() {
  const [inputDateRange, setInputDateRange] = useState({ start: '', end: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchAnalyticsData = async () => {
      try {
        const [salesData, expensesData] = await Promise.all([
          api.getSales({ limit: 1000, ...appliedDateRange }),
          api.getExpenses({ limit: 1000, ...appliedDateRange })
        ]);

        const monthRevenue = salesData.sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
        const monthExpenses = expensesData.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

        // Mocked trend data - a real implementation would require more complex backend logic
        const revenueTrend = [12000, 19000, 3000, 5000, 2000, 3000].map(v => v * (Math.random() + 0.5));
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        const topItems = salesData.sales
          .flatMap(s => s.items)
          .reduce((acc, item) => {
            const existing = acc.find(i => i.name === item.name);
            if (existing) {
              existing.qty += item.quantity;
            } else {
              acc.push({ name: item.name, qty: item.quantity });
            }
            return acc;
          }, [])
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        setData({
          monthRevenue,
          monthExpenses,
          revenue: revenueTrend,
          months,
          topItems
        });
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [appliedDateRange]);

  const handleApplyFilter = () => {
    setAppliedDateRange(inputDateRange);
  };

  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>Could not load analytics data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={inputDateRange.start}
            onChange={(e) => setInputDateRange({ ...inputDateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={inputDateRange.end}
            onChange={(e) => setInputDateRange({ ...inputDateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={handleApplyFilter}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-green-600">PHP {data.monthRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
          <div className="text-3xl font-bold text-red-600">PHP {data.monthExpenses.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Net Profit</div>
          <div className="text-3xl font-bold text-indigo-600">
            PHP {(data.monthRevenue - data.monthExpenses).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend (6 Months)</h3>
          <div className="h-64 flex items-end justify-between gap-3">
            {data.revenue.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2"> 
                <div className="text-xs font-semibold text-gray-700">PHP {(val/1000).toFixed(1)}k</div>
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t shadow-sm"
                  style={{ height: `${(val / Math.max(...data.revenue)) * 80}%` }}
                />
                <span className="text-xs text-gray-600 font-medium">{data.months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products by Sales Volume</h3>
          <div className="space-y-4">
            {data.topItems.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-sm font-bold text-gray-800">{item.qty} units</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${(item.qty / data.topItems[0].qty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
            <div className="font-semibold text-gray-800">Monthly Sales Report</div>
            <div className="text-xs text-gray-500 mt-1">Export as CSV or PDF</div>
          </button>
          <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
            <div className="font-semibold text-gray-800">Inventory Report</div>
            <div className="text-xs text-gray-500 mt-1">Current stock levels</div>
          </button>
          <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
            <div className="font-semibold text-gray-800">Expenses Report</div>
            <div className="text-xs text-gray-500 mt-1">Monthly expenses breakdown</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function Audits() {
  const [audits, setAudits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAudits, setTotalAudits] = useState(0);
  const [filter, setFilter] = useState({ action: '', resource: '' });
  const [search, setSearch] = useState('');
  const [viewingAudit, setViewingAudit] = useState(null);
  const auditsPerPage = 7;
  const debouncedSearch = useDebounce(search, 300);

  const fetchAudits = useCallback(async () => {
    try {
      const params = { page: currentPage, limit: auditsPerPage, ...filter, search: debouncedSearch };
      const data = await api.getAudits(params);
      setAudits(data.audits || []);
      setTotalAudits(data.total);
    } catch (error) {
      console.error("Failed to fetch audits", error);
    }
  }, [currentPage, filter, debouncedSearch, auditsPerPage]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const actionColors = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    SALE: 'bg-purple-100 text-purple-700',
    EXPENSE: 'bg-orange-100 text-orange-700'
  };

  const totalPages = Math.ceil(totalAudits / auditsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter.action}
              onChange={(e) => setFilter({...filter, action: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="SALE">Sale</option>
              <option value="EXPENSE">Expenses</option>
            </select>
            <select
              value={filter.resource}
              onChange={(e) => setFilter({...filter, resource: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Resources</option>
              <option value="items">Items</option>
              <option value="sales">Sales</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {audits.map(audit => (
            <div key={audit.audit_id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${actionColors[audit.action]}`}>
                      {audit.action}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{audit.resource}</span>
                    <span className="text-xs text-gray-500">by {audit.username}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(audit.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setViewingAudit(audit)}
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {viewingAudit && (
        <AuditDetailsModal audit={viewingAudit} onClose={() => setViewingAudit(null)} />
      )}
    </div>
  );
}

function Expenses({ setNotifications, user }) {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expenseStats, setExpenseStats] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ date: '', category: '', amount: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const debouncedSearch = useDebounce(search, 300);
  const expensesPerPage = 8;
  const showStatus = React.useContext(StatusContext);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await api.getExpenses({ page: currentPage, limit: expensesPerPage, search: debouncedSearch });
      setExpenses(data.expenses || []);
      setTotalExpenses(data.total);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
      showStatus('error', "Could not load expenses.");
    }
  }, [currentPage, debouncedSearch, showStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await api.getExpenseStats();
      setExpenseStats(stats);
    } catch (err) {
      console.error("Failed to fetch expense stats", err);
      showStatus('error', 'Could not load expense statistics.');
    }
  }, [showStatus]);

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [fetchExpenses, fetchStats]);

  const validateForm = () => {
    const errors = {};
    if (!form.date) errors.date = 'Date is required.';
    else if (new Date(form.date) > new Date()) errors.date = 'Date cannot be in the future.';
    
    if (!form.category) errors.category = 'Category is required.';

    if (!form.amount) errors.amount = 'Amount is required.';
    else if (parseFloat(form.amount) <= 0) errors.amount = 'Amount must be a positive number.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditingExpense(null);
    setForm({ date: '', category: '', amount: '', notes: '' });
    setFormErrors({});
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setForm({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      notes: expense.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    const apiCall = editingExpense
      ? api.updateExpense(editingExpense.expense_id, form)
      : api.createExpense(form);
    const successMessage = editingExpense
      ? 'Expense updated successfully!'
      : 'Expense added successfully!';

    try {
      await apiCall;
      if (editingExpense) {
        setNotifications(prev => [{
          id: `update-expense-${editingExpense.expense_id}-${Date.now()}`,
          message: `${user.full_name} updated an expense of ${form.amount} for ${form.category}.`,
          type: 'expense_update',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      } else {
        setNotifications(prev => [{
          id: `create-expense-${Date.now()}`,
          message: `${user.full_name} added a new expense of ${form.amount} for ${form.category}.`,
          type: 'expense_create',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
      fetchExpenses(); // Refresh the list of expenses
      fetchStats(); // Refresh the statistics cards
      handleCloseModal();
      showStatus('success', successMessage);
    } catch (error) {
      showStatus('error', `Failed to add expense: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId) => {
    const expense = expenses.find(e => e.expense_id === expenseId);
    try {
      await api.deleteExpense(expenseId);
      setExpenseToDelete(null);
      fetchExpenses(); // Refresh list
      fetchStats(); // Refresh the statistics cards
      setNotifications(prev => [{
        id: `delete-expense-${expenseId}-${Date.now()}`,
        message: `${user.full_name} deleted an expense: ${expense.category} for PHP ${expense.amount}.`,
        type: 'expense_delete',
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showStatus('success', 'Expense deleted successfully.');
    } catch (error) {
      showStatus('error', `Error: ${error.message}`);
    }
  };

    const totalPages = Math.ceil(totalExpenses / expensesPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Expenses Tracking</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button onClick={() => {
            setEditingExpense(null);
            setShowForm(true);
          }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <Plus className="w-5 h-5" />
            Add Expenses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 mb-1">Today's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.today.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 mb-1">This Week's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.week.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 mb-1">This Month's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.month.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 mb-1">This Year's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.year.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map(expense => (
                <tr key={expense.expense_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">PHP {parseFloat(expense.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.notes}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.username}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(expense)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={handleCloseModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.date ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.date && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.category ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.category && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  value={form.amount}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.amount ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.amount && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-32 flex justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    editingExpense ? 'Save Changes' : 'Add Expense'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-800">Delete Expense?</h3>
              <p className="mt-2 text-gray-600">
                Are you sure you want to delete the expense for{' '}
                <span className="font-semibold">{expenseToDelete.category}</span> amounting to{' '}
                <span className="font-semibold">PHP {parseFloat(expenseToDelete.amount).toFixed(2)}</span>?
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(expenseToDelete.expense_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors">
                  Delete
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditDetailsModal({ audit, onClose }) {
  const formatJson = (jsonString) => {
    if (typeof jsonString === 'object' && jsonString !== null) {
      return JSON.stringify(jsonString, null, 2);
    }
    if (typeof jsonString === 'string') {
      try { return JSON.stringify(JSON.parse(jsonString), null, 2); } catch (e) { return jsonString; }
    }
    return 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Audit Log Details</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold text-gray-600">Action:</span> {audit.action}</div>
            <div><span className="font-semibold text-gray-600">Resource:</span> {audit.resource} (ID: {audit.resource_id || 'N/A'})</div>
            <div><span className="font-semibold text-gray-600">User:</span> {audit.username}</div>
            <div><span className="font-semibold text-gray-600">IP Address:</span> {audit.ip_address}</div>
            <div className="col-span-2"><span className="font-semibold text-gray-600">Timestamp:</span> {new Date(audit.created_at).toLocaleString()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Before State</h4>
              <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                <code>
                  {formatJson(audit.before_state)}
                </code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">After State</h4>
              <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                <code>
                  {formatJson(audit.after_state)}
                </code>
              </pre>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
}

function StatusModal({ type, message, onClose }) {
  const styles = {
    success: {
      Icon: CheckCircle,
      title: 'Success!',
      iconColor: 'text-green-500',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      Icon: XCircle,
      title: 'Error!',
      iconColor: 'text-red-500',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
  };
  const { Icon, title, iconColor, buttonColor } = styles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-8 text-center transform transition-all animate-in fade-in-0 zoom-in-95">
        <Icon className={`w-16 h-16 mx-auto ${iconColor}`} />
        <h3 className={`mt-4 text-2xl font-bold text-gray-800`}>{title}</h3>
        <p className="mt-2 text-gray-600">{message}</p>
        <button
          onClick={onClose}
          className={`mt-6 w-full px-4 py-2 text-white rounded-lg font-semibold transition ${buttonColor}`}
        >
          Close
        </button>
      </div>
    </div>
  );
}


export default App;

function ItemFormModal({ item, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({
    item_number: item?.item_number || '',
    name: item?.name || '',
    category: item?.category || '',
    qty_in_stock: item?.qty_in_stock || 0,
    reorder_level: item?.reorder_level || 0,
    purchase_price: item?.purchase_price || '',
    selling_price: item?.selling_price || ''
  });

  const validate = () => {
    const errors = {};
    if (!form.item_number.trim()) errors.item_number = 'Item Number is required.';
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.selling_price) errors.selling_price = 'Selling Price is required.';
    else if (parseFloat(form.selling_price) <= 0) errors.selling_price = 'Selling Price must be positive.';

    if (form.purchase_price && parseFloat(form.purchase_price) < 0) {
      errors.purchase_price = 'Purchase Price cannot be negative.';
    }
    if (parseInt(form.qty_in_stock, 10) < 0) {
      errors.qty_in_stock = 'Quantity cannot be negative.';
    }
    if (parseInt(form.reorder_level, 10) < 0) {
      errors.reorder_level = 'Reorder Level cannot be negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(item ? item.item_id : null, { ...form, purchase_price: form.purchase_price || 0 });
      // The onClose will be called by the parent, unmounting this component.
    } catch (error) {
      // If there's an error, the modal stays open, so we stop the saving indicator.
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">{item ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Number</label>
              <input
                name="item_number"
                type="text"
                value={form.item_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.item_number ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {formErrors.item_number && (
                <p className="mt-1 text-xs text-red-600">{formErrors.item_number}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                name="qty_in_stock"
                type="number"
                value={form.qty_in_stock}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.qty_in_stock ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.qty_in_stock && (
                <p className="mt-1 text-xs text-red-600">{formErrors.qty_in_stock}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                name="reorder_level"
                type="number"
                value={form.reorder_level}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.reorder_level ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.reorder_level && (
                <p className="mt-1 text-xs text-red-600">{formErrors.reorder_level}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
              <input
                name="purchase_price"
                type="number"
                step="0.01"
                value={form.purchase_price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.purchase_price ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.purchase_price && (
                <p className="mt-1 text-xs text-red-600">{formErrors.purchase_price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
              <input
                name="selling_price"
                type="number"
                step="0.01"
                value={form.selling_price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.selling_price ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.selling_price && (
                <p className="mt-1 text-xs text-red-600">{formErrors.selling_price}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-28 flex justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Save Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sales({ setNotifications, user }) {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const salesPerPage = 11; // Define how many sales per page

  const fetchSales = useCallback(async () => {
    try {
      const data = await api.getSales({ page: currentPage, limit: salesPerPage, search: debouncedSearch });
      setSales(data.sales || []);
      setTotalSales(data.total);
    } catch (error) {
      console.error("Failed to fetch sales", error);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSaleCreated = () => { // This function is called after a new sale is successfully created
    setShowSaleModal(false); // Close the modal
    setCurrentPage(1); // Go back to the first page to see the new sale
    setSearch(''); // Clear search
    setNotifications(prev => [{
      id: `new-sale-${Date.now()}`,
      message: `${user.full_name} made a new sale.`,
      type: 'sale_create',
      read: false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    fetchSales(); // Refresh the sales list
  };

  const totalPages = Math.ceil(totalSales / salesPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Sales Transactions</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Sale # or Admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button onClick={() => setShowSaleModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <Plus className="w-5 h-5" />
            New Sale
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sale #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.length > 0 ? (
                sales.map(sale => (
                  <tr key={sale.sale_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{sale.sale_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.payment_method}</td> 
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">PHP {parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setViewingSale(sale)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <FileText className="w-4 h-4" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-4">No sales transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {showSaleModal && (
        <NewSaleModal
          onClose={() => setShowSaleModal(false)}
          onSaleCreated={handleSaleCreated}
        />
      )}
      {viewingSale && (
        <SaleDetailsModal sale={viewingSale} onClose={() => setViewingSale(null)} />
      )}
    </div>
  );
}

function SaleDetailsModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Sale Details: {sale.sale_number}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><span className="font-semibold text-gray-600">Date:</span> {new Date(sale.created_at).toLocaleString()}</div>
            <div><span className="font-semibold text-gray-600">Admin:</span> {sale.username}</div>
            <div><span className="font-semibold text-gray-600">Payment:</span> {sale.payment_method}</div>
          </div>

          <h4 className="font-semibold text-gray-700 mb-2">Items Sold</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sale.items.map(item => (
                  <tr key={item.item_id}>
                    <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm">{item.quantity}</td> 
                    <td className="px-4 py-3 text-sm">PHP {parseFloat(item.price_at_sale).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">PHP {parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end"> 
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span> <span>${(parseFloat(sale.total_amount) - parseFloat(sale.tax_amount) + parseFloat(sale.discount_amount)).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tax:</span> <span>${parseFloat(sale.tax_amount).toFixed(2)}</span></div>
              {parseFloat(sale.discount_amount) > 0 && <div className="flex justify-between"><span className="text-gray-600">Discount:</span> <span className="text-red-600">-${parseFloat(sale.discount_amount).toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span >Total:</span> <span>${parseFloat(sale.total_amount).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NewSaleModal({ onClose, onSaleCreated }) {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const showStatus = React.useContext(StatusContext);

  useEffect(() => {
    // Fetch all items for the sale modal
    api.getItems({ limit: 1000 }).then(data => setInventoryItems(data.items));
  }, []);

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    !cart.some(cartItem => cartItem.item_id === item.item_id)
  );

  const addToCart = (item) => {
    setCart([...cart, { ...item, quantity: 1, price_at_sale: item.selling_price }]);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.item_id !== itemId));
    } else {
      setCart(cart.map(item => item.item_id === itemId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price_at_sale)), 0);
  const tax = subtotal * 0.08; // Example 8% tax
  const total = subtotal + tax;

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      showStatus('error', 'Cart is empty. Please add items to proceed.');
      return;
    }
    setLoading(true);
    try {
      const saleData = {
        items: cart.map(({ item_id, quantity, price_at_sale }) => ({ item_id, quantity, price_at_sale })),
        payment_method: paymentMethod,
        tax_amount: tax,
        discount_amount: 0,
        total_amount: total,
      };
      await api.createSale(saleData);
      onSaleCreated();
      showStatus('success', 'Sale created successfully!');
    } catch (error) {
      console.error('Failed to create sale', error);
      showStatus('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Create New Sale</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Item Selection */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-4 sticky top-0 bg-white border-b">
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="divide-y">
              {filteredItems.map(item => (
                <div key={item.item_id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">In Stock: {item.qty_in_stock}</div>
                  </div>
                  <button onClick={() => addToCart(item)} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"><Plus className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-gray-600" /> <h4 className="text-lg font-semibold">Current Sale</h4></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? <div className="text-center text-gray-500 py-8">Cart is empty</div> :
                cart.map(item => (
                  <div key={item.item_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">PHP {parseFloat(item.price_at_sale).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.item_id, item.quantity - 1)} className="p-1 border rounded"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.item_id, item.quantity + 1)} className="p-1 border rounded"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-6 border-t bg-gray-50 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">PHP {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tax (8%)</span><span className="font-medium">PHP {tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span >Total</span><span>PHP {total.toFixed(2)}</span></div>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full mt-2 px-3 py-2 border rounded-lg">
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
              </select>
              <button
                onClick={handleCreateSale}
                disabled={loading || cart.length === 0}
                className="w-full mt-2 flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}