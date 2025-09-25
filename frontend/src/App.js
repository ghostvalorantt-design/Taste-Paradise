import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "./components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { 
  ChefHat, 
  DollarSign, 
  Clock, 
  Users, 
  Plus, 
  Edit3, 
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Receipt
} from "lucide-react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for sharing state across components
const RestaurantContext = createContext();

const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

// Table Management Component
const TableManagement = ({ onTableSelect }) => {
  const { refreshData, orders } = useRestaurant();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableData, setNewTableData] = useState({
    table_number: '',
    capacity: 4,
    position_x: 0,
    position_y: 0
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      setTables(response.data);
      
      // If no tables exist, create default ones
      if (response.data.length === 0) {
        await initializeDefaultTables();
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const initializeDefaultTables = async () => {
    try {
      await axios.post(`${API}/tables/initialize-default`);
      await fetchTables();
    } catch (error) {
      console.error('Error initializing tables:', error);
    }
  };

  const getTableColor = (status) => {
    switch (status) {
      case 'available': return 'bg-teal-500 hover:bg-teal-600';
      case 'occupied': return 'bg-red-500 hover:bg-red-600';
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cleaning': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-teal-500 hover:bg-teal-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✅';
      case 'occupied': return '👥';
      case 'reserved': return '📅';
      case 'cleaning': return '🧹';
      default: return '✅';
    }
  };

  const handleTableClick = async (table) => {
    // Check if table has active orders
    const tableOrders = orders.filter(order => 
      order.table_number === table.table_number && 
      !['served', 'cancelled'].includes(order.status)
    );

    if (tableOrders.length > 0) {
      // Table has active orders - show options
      const choice = window.confirm(
        `Table ${table.table_number} has ${tableOrders.length} active order(s)\n\n` +
        `Options:\n` +
        `OK - Generate Bill & Process Payment\n` +
        `Cancel - View Orders/Create New Order`
      );

      if (choice) {
        // Generate bill for the latest order
        const latestOrder = tableOrders[tableOrders.length - 1];
        if (onTableSelect) {
          onTableSelect(table, 'generate-bill', latestOrder);
        }
      } else {
        if (onTableSelect) {
          onTableSelect(table, 'view-orders');
        }
      }
    } else {
      // Table is empty - create new order
      if (onTableSelect) {
        onTableSelect(table, 'new-order');
      }
    }
  };

  const changeTableStatus = async (tableId, newStatus) => {
    try {
      await axios.put(`${API}/tables/${tableId}`, { status: newStatus });
      await fetchTables();
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  const addNewTable = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tables`, newTableData);
      await fetchTables();
      setShowAddTable(false);
      setNewTableData({
        table_number: '',
        capacity: 4,
        position_x: 0,
        position_y: 0
      });
      alert('New table added successfully!');
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Error adding table');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🏪 Restaurant Tables</span>
            <Button 
              onClick={fetchTables} 
              size="sm" 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <Button 
            onClick={() => setShowAddTable(true)} 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Table
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-teal-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span>Cleaning</span>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`relative aspect-square rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${getTableColor(table.status)} text-white flex flex-col items-center justify-center p-4 shadow-md`}
              onClick={() => handleTableClick(table)}
            >
              <div className="text-xl font-bold">{table.table_number}</div>
              <div className="text-sm opacity-90">Cap: {table.capacity}</div>
              <div className="absolute top-1 right-1 text-lg">
                {getStatusIcon(table.status)}
              </div>
              
              {/* Quick Status Change */}
              <div className="absolute bottom-1 left-1 right-1">
                <select
                  className="w-full text-xs bg-white/20 text-white rounded px-1 py-0.5"
                  value={table.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    changeTableStatus(table.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tables found. Initializing default tables...</p>
          </div>
        )}

        {/* Add New Table Form */}
        {showAddTable && (
          <Card className="mt-6 border-orange-200">
            <CardHeader>
              <CardTitle>Add New Table</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addNewTable} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="table_number">Table Number</Label>
                    <Input
                      id="table_number"
                      value={newTableData.table_number}
                      onChange={(e) => setNewTableData({...newTableData, table_number: e.target.value})}
                      placeholder="e.g., T7"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity (People)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newTableData.capacity}
                      onChange={(e) => setNewTableData({...newTableData, capacity: parseInt(e.target.value)})}
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    Add Table
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddTable(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

// Restaurant Context Provider
const RestaurantProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, statsRes, kotsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/menu`),
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/kot`)
      ]);
      
      setOrders(ordersRes.data);
      setMenuItems(menuRes.data);
      setDashboardStats(statsRes.data);
      setKots(kotsRes.data);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const value = {
    orders,
    setOrders,
    menuItems,
    setMenuItems,
    dashboardStats,
    setDashboardStats,
    kots,
    setKots,
    loading,
    refreshData
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DollarSign },
    { path: '/orders', label: 'Orders', icon: Users },
    { path: '/new-order', label: 'New Order', icon: Plus },
    { path: '/kot', label: 'KOT', icon: ChefHat },
    { path: '/menu', label: 'Menu', icon: Edit3 }
  ];

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-orange-600">Taste Paradise</h1>
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center space-x-2 ${isActive ? 'bg-orange-100 text-orange-700' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
          <RefreshDataButton />
        </div>
      </div>
    </div>
  );
};

const RefreshDataButton = () => {
  const { refreshData, loading } = useRestaurant();
  
  return (
    <Button 
      onClick={refreshData} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span>Refresh</span>
    </Button>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { dashboardStats, loading, orders, refreshData } = useRestaurant();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (loading || !dashboardStats) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    
    // Show table actions dialog
    const action = window.confirm(`Table ${table.table_number} (${table.status})\n\nActions:\nOK - Create New Order\nCancel - View Table Orders`);
    
    if (action) {
      // Create new order for this table
      navigate('/new-order', { state: { selectedTable: table.table_number } });
    } else {
      // View table orders or generate KOT
      if (table.current_order_id) {
        const kotAction = window.confirm(`Table ${table.table_number} has an active order.\n\nOK - Generate KOT\nCancel - View Orders`);
        if (kotAction) {
          navigate('/kot');
        } else {
          navigate('/orders');
        }
      } else {
        navigate('/orders');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Today's Orders</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{dashboardStats.today_orders}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹{dashboardStats.today_revenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Kitchen Status</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(dashboardStats.kitchen_status)} capitalize`}>
              {dashboardStats.kitchen_status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{dashboardStats.pending_payments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pending Orders</span>
              <Badge variant="secondary">{dashboardStats.pending_orders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cooking Orders</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {dashboardStats.cooking_orders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Ready Orders</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {dashboardStats.ready_orders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Served Today</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {dashboardStats.served_orders}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700" asChild>
              <a href="/new-order">
                <Plus className="mr-2 h-4 w-4" />
                Create New Order
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/orders">
                <Eye className="mr-2 h-4 w-4" />
                View All Orders
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/kot">
                <ChefHat className="mr-2 h-4 w-4" />
                Kitchen Orders
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Table Management Section */}
      <div className="mt-8">
        <TableManagement onTableSelect={handleTableSelect} />
      </div>
    </div>
  );
};

// Invoice Component
const InvoiceModal = ({ order, isOpen, onClose }) => {
  const currentDate = new Date();
  const gstRate = 0.05; // 5% GST
  const subtotal = order?.total_amount || 0;
  const gstAmount = subtotal * gstRate;
  const finalTotal = subtotal + gstAmount;

  const printInvoice = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="invoice-container bg-white p-8" id="invoice-content">
          {/* Invoice Header */}
          <div className="border-b-2 border-orange-600 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-orange-600">Taste Paradise</h1>
                <p className="text-gray-600">Restaurant & Billing Service</p>
                <p className="text-sm text-gray-500">123 Food Street, Flavor City, FC 12345</p>
                <p className="text-sm text-gray-500">Phone: +91 98765 43210 | Email: info@tasteparadise.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                <p className="text-gray-600">#{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">
                  Date: {currentDate.toLocaleDateString('en-IN')}
                </p>
                <p className="text-sm text-gray-500">
                  Time: {currentDate.toLocaleTimeString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Bill To:</h3>
              <p className="text-gray-700">{order.customer_name || 'Walk-in Customer'}</p>
              {order.table_number && (
                <p className="text-gray-600">Table: {order.table_number}</p>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Order Details:</h3>
              <p className="text-gray-600">
                Status: <span className={`capitalize ${order.status === 'cancelled' ? 'text-red-600 font-semibold' : ''}`}>
                  {order.status === 'cancelled' ? '❌ CANCELLED' : order.status}
                </span>
              </p>
              <p className="text-gray-600">Payment: <span className="capitalize">{order.payment_status}</span></p>
              {order.payment_method && (
                <p className="text-gray-600">Method: <span className="capitalize">{order.payment_method}</span></p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Rate (₹)</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      <div>
                        <p className="font-medium">{item.menu_item_name}</p>
                        {item.special_instructions && (
                          <p className="text-sm text-gray-500 italic">Note: {item.special_instructions}</p>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₹{(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">GST (5%):</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              {order.status === 'cancelled' && (
                <div className="flex justify-between py-2 border-b text-red-600">
                  <span className="font-medium">Cancellation:</span>
                  <span>-₹{finalTotal.toFixed(2)}</span>
                </div>
              )}
              <div className={`flex justify-between py-2 border-t-2 border-orange-600 font-bold text-lg ${order.status === 'cancelled' ? 'text-red-600' : ''}`}>
                <span>Total Amount:</span>
                <span>{order.status === 'cancelled' ? '₹0.00 (REFUNDED)' : `₹${finalTotal.toFixed(2)}`}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-gray-600">
            <p className="text-sm">Thank you for dining with us at Taste Paradise!</p>
            <p className="text-xs mt-2">GST No: 27AAAAA0000A1Z5 | FSSAI Lic: 12345678901234</p>
            <p className="text-xs">This is a computer generated invoice.</p>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end space-x-2 mt-4 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={printInvoice} className="bg-orange-600 hover:bg-orange-700">
            🖨️ Print Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Orders Component
const Orders = () => {
  const { orders, refreshData } = useRestaurant();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cooking': return <ChefHat className="h-4 w-4 text-blue-500" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'served': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      cooking: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `${colors[status]} capitalize`;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { status: newStatus });
      refreshData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const cancelOrder = async (orderId, customerName) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel the order for ${customerName || 'Walk-in Customer'}?\n\nThis action cannot be undone.`
    );
    
    if (confirmCancel) {
      try {
        await axios.put(`${API}/orders/${orderId}`, { status: 'cancelled' });
        refreshData();
        alert('Order cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Error cancelling order');
      }
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus, paymentMethod = null) => {
    try {
      const updateData = { payment_status: paymentStatus };
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }
      await axios.put(`${API}/orders/${orderId}`, updateData);
      refreshData();
      alert(`Payment marked as ${paymentStatus}!`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const generateBill = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Order Management</h2>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="cooking">Cooking</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="served">Served</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(-8)}
                      </TableCell>
                      <TableCell>{order.customer_name || 'Walk-in'}</TableCell>
                      <TableCell>{order.table_number || 'N/A'}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-semibold">₹{order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(order.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(order.status)}
                            <span>{order.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                            className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {order.payment_status}
                          </Badge>
                          {order.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {order.payment_method}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {/* Order Status Actions */}
                          {order.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'cooking')}
                                className="text-xs"
                              >
                                Start Cooking
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => cancelOrder(order.id, order.customer_name)}
                                className="text-xs bg-red-50 text-red-700 hover:bg-red-100"
                              >
                                ❌ Cancel
                              </Button>
                            </>
                          )}
                          {order.status === 'cooking' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="text-xs"
                              >
                                Ready
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => cancelOrder(order.id, order.customer_name)}
                                className="text-xs bg-red-50 text-red-700 hover:bg-red-100"
                              >
                                ❌ Cancel
                              </Button>
                            </>
                          )}
                          {order.status === 'ready' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus(order.id, 'served')}
                              className="text-xs"
                            >
                              Served
                            </Button>
                          )}
                          
                          {/* Payment Actions - Only for non-cancelled orders */}
                          {order.payment_status === 'pending' && order.status !== 'cancelled' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updatePaymentStatus(order.id, 'paid', 'cash')}
                                className="text-xs bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                💰 Cash
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updatePaymentStatus(order.id, 'paid', 'online')}
                                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                💳 Online
                              </Button>
                            </>
                          )}
                          
                          {/* Bill Generation - Only for served/paid orders */}
                          {(order.status === 'served' || order.payment_status === 'paid') && order.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateBill(order)}
                              className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100"
                            >
                              🧾 Bill
                            </Button>
                          )}

                          {/* Show bill for cancelled orders too (for refund purposes) */}
                          {order.status === 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateBill(order)}
                              className="text-xs bg-gray-50 text-gray-700 hover:bg-gray-100"
                            >
                              🧾 Receipt
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Invoice Modal */}
      <InvoiceModal 
        order={selectedOrder}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
      />
    </div>
  );
};

// New Order Component
const NewOrder = () => {
  const { menuItems, refreshData } = useRestaurant();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(location.state?.selectedTable || '');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all' 
    ? menuItems.filter(item => item.is_available)
    : menuItems.filter(item => item.category === selectedCategory && item.is_available);

  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.menu_item_id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menu_item_id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        special_instructions: ''
      }]);
    }
  };

  const updateQuantity = (menuItemId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.menu_item_id !== menuItemId));
    } else {
      setCart(cart.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    try {
      await axios.post(`${API}/orders`, {
        customer_name: customerName,
        table_number: tableNumber,
        items: cart
      });
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setTableNumber('');
      
      alert('Order created successfully!');
      refreshData();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">New Order</h2>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-orange-600">₹{item.price}</span>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => addToCart(item)} 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="table-number">Table Number</Label>
                <Input
                  id="table-number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cart ({cart.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items in cart</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menu_item_id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.menu_item_name}</h4>
                        <p className="text-sm text-gray-600">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                    <Button 
                      onClick={submitOrder} 
                      className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                    >
                      Place Order
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// KOT Component
const KOTScreen = () => {
  const { orders, kots, refreshData } = useRestaurant();

  const generateKOT = async (orderId) => {
    try {
      await axios.post(`${API}/kot/${orderId}`);
      refreshData();
      alert('KOT generated successfully!');
    } catch (error) {
      console.error('Error generating KOT:', error);
      alert('Error generating KOT');
    }
  };

  const activeOrders = orders.filter(order => 
    ['pending', 'cooking', 'ready'].includes(order.status)
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Kitchen Order Tickets (KOT)</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending KOTs */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Needing KOT</CardTitle>
          </CardHeader>
          <CardContent>
            {activeOrders.filter(order => !order.kot_generated).map((order) => (
              <div key={order.id} className="border rounded p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                  <Button 
                    size="sm" 
                    onClick={() => generateKOT(order.id)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Generate KOT
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {order.customer_name || 'Walk-in'} - Table {order.table_number || 'N/A'}
                </p>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menu_item_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Generated KOTs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent KOTs</CardTitle>
          </CardHeader>
          <CardContent>
            {kots.slice(0, 10).map((kot) => (
              <div key={kot.id} className="border rounded p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{kot.order_number}</h3>
                  <Badge className="bg-green-100 text-green-800">
                    {kot.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Table {kot.table_number || 'N/A'} - {new Date(kot.created_at).toLocaleTimeString()}
                </p>
                <div className="space-y-1">
                  {kot.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menu_item_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Menu Management Component
const MenuManagement = () => {
  const { menuItems, refreshData } = useRestaurant();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparation_time: 15
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      preparation_time: 15
    });
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingItem) {
        await axios.put(`${API}/menu/${editingItem.id}`, data);
      } else {
        await axios.post(`${API}/menu`, data);
      }
      
      refreshData();
      resetForm();
      alert(editingItem ? 'Menu item updated!' : 'Menu item added!');
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item');
    }
  };

  const deleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API}/menu/${itemId}`);
        refreshData();
        alert('Menu item deleted!');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Error deleting menu item');
      }
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      preparation_time: item.preparation_time
    });
    setIsAddingItem(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Menu Management</h2>
        <Button 
          onClick={() => setIsAddingItem(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prep-time">Preparation Time (minutes)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({...formData, preparation_time: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Menu Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items ({menuItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Prep time: {item.preparation_time} mins
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(item)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <RestaurantProvider>
      <div className="min-h-screen bg-gray-50">
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/kot" element={<KOTScreen />} />
            <Route path="/menu" element={<MenuManagement />} />
          </Routes>
        </BrowserRouter>
      </div>
    </RestaurantProvider>
  );
}

export default App;