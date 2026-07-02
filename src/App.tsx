import React, { useState, useEffect } from 'react';
import { Product, Sale, Expense, ExchangeRates, CapitalAllocation, CapitalPoolOverride, DashboardStats, Customer, PreOrder } from './types';
import { 
  initialProducts, 
  initialSales, 
  initialExpenses,
  initialCustomers,
  initialPreOrders,
  defaultExchangeRates,
  defaultCapitalAllocation
} from './utils/mockData';
import { api } from './utils/api';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { SalesTracker } from './components/SalesTracker';
import { Expenses } from './components/Expenses';
import { Settings } from './components/Settings';
import { Customers } from './components/Customers';
import { PreOrders } from './components/PreOrders';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  DollarSign, 
  Settings as SettingsIcon,
  Layers,
  Apple,
  Users,
  Clock
} from 'lucide-react';

// Helper to safely extract error messages in TypeScript
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unknown error occurred';
};

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultExchangeRates);
  const [capitalAllocation, setCapitalAllocation] = useState<CapitalAllocation>(defaultCapitalAllocation);
  const [capitalPoolOverride, setCapitalPoolOverride] = useState<CapitalPoolOverride>({ enabled: false, value: 0 });

  // Load from Backend SQLite Database on Mount
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const fetchedProducts = await api.getProducts();
        const fetchedSales = await api.getSales();
        const fetchedExpenses = await api.getExpenses();
        const fetchedCustomers = await api.getCustomers();
        const fetchedPreOrders = await api.getPreOrders();
        const settings = await api.getSettings();

        setProducts(fetchedProducts);
        setSales(fetchedSales);
        setExpenses(fetchedExpenses);
        setCustomers(fetchedCustomers);
        setPreOrders(fetchedPreOrders);
        
        if (settings.exchangeRates) setExchangeRates(settings.exchangeRates);
        if (settings.capitalAllocation) setCapitalAllocation(settings.capitalAllocation);
        if (settings.capitalPoolOverride) setCapitalPoolOverride(settings.capitalPoolOverride);
      } catch (err) {
        console.error('Error loading data from SQLite, using local fallback:', err);
        // Fallback to mock data if backend is offline
        setProducts(initialProducts);
        setSales(initialSales);
        setExpenses(initialExpenses);
        setCustomers(initialCustomers);
        setPreOrders(initialPreOrders);
        setExchangeRates(defaultExchangeRates);
        setCapitalAllocation(defaultCapitalAllocation);
        setCapitalPoolOverride({ enabled: false, value: 0 });
      }
    };

    loadDatabase();
  }, []);

  // Calculate Dashboard Statistics
  const stats: DashboardStats = React.useMemo(() => {
    const totalInvestedDzd = capitalPoolOverride.enabled 
      ? capitalPoolOverride.value 
      : products.reduce((acc, p) => acc + (p.quantityPurchased * p.landedCostDzd), 0) +
        expenses.reduce((acc, e) => acc + e.amountDzd, 0);

    const totalInvestedEur = capitalPoolOverride.enabled 
      ? (exchangeRates.global > 0 ? capitalPoolOverride.value / exchangeRates.global : 0)
      : products.reduce((acc, p) => acc + (p.quantityPurchased * (p.originalCostEur + (p.deliveryCostDzd / p.exchangeRate))), 0) +
        expenses.reduce((acc, e) => acc + e.amountEur, 0);

    const totalRevenueDzd = sales.reduce((acc, s) => acc + s.totalRevenueDzd, 0);

    const totalAdSpendDzd = expenses.filter(e => e.category === 'Ad Spend').reduce((acc, e) => acc + e.amountDzd, 0);
    const totalCargoDzd = expenses.filter(e => e.category === 'Cargo/Shipping').reduce((acc, e) => acc + e.amountDzd, 0);
    const totalOtherExpensesDzd = expenses.filter(e => e.category !== 'Ad Spend' && e.category !== 'Cargo/Shipping').reduce((acc, e) => acc + e.amountDzd, 0);
    
    const totalExpensesDzd = expenses.reduce((acc, e) => acc + e.amountDzd, 0);
    const totalExpensesEur = expenses.reduce((acc, e) => acc + e.amountEur, 0);

    // Profit from sales
    const totalSalesProfitDzd = sales.reduce((acc, s) => acc + s.totalProfitDzd, 0);
    const totalSalesProfitEur = sales.reduce((acc, s) => acc + s.totalProfitEur, 0);

    // Net profit (Sales profit - Global expenses)
    const totalProfitDzd = totalSalesProfitDzd - totalExpensesDzd;
    const totalProfitEur = totalSalesProfitEur - totalExpensesEur;

    const lowStockCount = products.filter(p => !p.archived && p.remainingStock > 0 && p.remainingStock <= 3).length;
    const outOfStockCount = products.filter(p => !p.archived && p.remainingStock === 0).length;

    return {
      totalInvestedEur,
      totalInvestedDzd,
      totalRevenueDzd,
      totalAdSpendDzd,
      totalCargoDzd,
      totalOtherExpensesDzd,
      totalProfitDzd,
      totalProfitEur,
      lowStockCount,
      outOfStockCount
    };
  }, [products, sales, expenses, capitalPoolOverride, exchangeRates]);

  // --- Core CRUD Handlers calling Backend Database ---

  // Add Product
  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'landedCostDzd' | 'remainingStock' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod-${Date.now()}`;
    const landedCostDzd = (newProduct.originalCostEur * newProduct.exchangeRate) + newProduct.deliveryCostDzd;
    const remainingStock = newProduct.quantityPurchased - newProduct.quantitySold;

    const product: Product = {
      ...newProduct,
      id,
      landedCostDzd,
      remainingStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    api.createProduct(product)
      .then(saved => setProducts(prev => [saved, ...prev]))
      .catch(err => alert('Error saving product: ' + getErrorMessage(err)));
  };

  // Add Products Bulk (CSV Import)
  const handleAddProductsBulk = (newProducts: Omit<Product, 'id' | 'landedCostDzd' | 'remainingStock' | 'createdAt' | 'updatedAt'>[]) => {
    const productsToCreate: Product[] = newProducts.map((p, index) => {
      const id = `prod-bulk-${Date.now()}-${index}`;
      const landedCostDzd = (p.originalCostEur * p.exchangeRate) + p.deliveryCostDzd;
      const remainingStock = p.quantityPurchased - p.quantitySold;
      return {
        ...p,
        id,
        landedCostDzd,
        remainingStock,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    api.createProductsBulk(productsToCreate)
      .then(savedList => {
        api.getProducts().then(setProducts);
        alert(`🎉 Successfully imported ${savedList.length} products!`);
      })
      .catch(err => alert('Error importing products: ' + getErrorMessage(err)));
  };

  // Update Product
  const handleUpdateProduct = (updatedProduct: Product) => {
    const landedCostDzd = (updatedProduct.originalCostEur * updatedProduct.exchangeRate) + updatedProduct.deliveryCostDzd;
    const remainingStock = updatedProduct.quantityPurchased - updatedProduct.quantitySold;

    const productWithCalcs: Product = {
      ...updatedProduct,
      landedCostDzd,
      remainingStock,
      updatedAt: new Date().toISOString()
    };

    api.updateProduct(productWithCalcs)
      .then(saved => setProducts(prev => prev.map(p => p.id === saved.id ? saved : p)))
      .catch(err => alert('Error updating product: ' + getErrorMessage(err)));
  };

  // Delete/Archive Product
  const handleDeleteProduct = (id: string) => {
    api.deleteProduct(id)
      .then(() => setProducts(prev => prev.map(p => p.id === id ? { ...p, archived: true } : p)))
      .catch(err => alert('Error archiving product: ' + getErrorMessage(err)));
  };

  // Add Sale
  const handleAddSale = (newSale: Omit<Sale, 'id' | 'totalRevenueDzd' | 'totalBaseCostDzd' | 'totalProfitDzd' | 'totalProfitEur'>) => {
    const id = `sale-${Date.now()}`;
    
    // Calculate totals across all items
    let totalRevenueDzd = 0;
    let totalBaseCostDzd = 0;
    let totalProfitDzd = 0;
    let totalProfitEur = 0;

    const items = newSale.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const landedCost = product ? product.landedCostDzd : 0;
      const rate = product ? product.exchangeRate : 250;

      const baseCostDzd = item.quantity * landedCost;
      const itemRevenueDzd = item.quantity * item.sellPriceDzd;
      const profitDzd = itemRevenueDzd - baseCostDzd;
      const profitEur = profitDzd / rate;

      totalRevenueDzd += itemRevenueDzd;
      totalBaseCostDzd += baseCostDzd;
      totalProfitDzd += profitDzd;
      totalProfitEur += profitEur;

      return {
        ...item,
        baseCostDzd,
        profitDzd,
        exchangeRateUsed: rate
      };
    });

    const sale: Sale = {
      ...newSale,
      id,
      items,
      totalRevenueDzd,
      totalBaseCostDzd,
      totalProfitDzd,
      totalProfitEur
    };

    api.createSale(sale)
      .then(saved => {
        setSales(prev => [saved, ...prev]);
        api.getProducts().then(setProducts);
      })
      .catch(err => alert('Error logging sale: ' + getErrorMessage(err)));
  };

  // Delete/Refund Sale
  const handleDeleteSale = (saleId: string) => {
    api.deleteSale(saleId)
      .then(() => {
        setSales(prev => prev.filter(s => s.id !== saleId));
        api.getProducts().then(setProducts);
      })
      .catch(err => alert('Error deleting sale: ' + getErrorMessage(err)));
  };

  // --- Customer Handlers ---
  const handleAddCustomer = (newCust: Omit<Customer, 'id'>) => {
    const customer: Customer = {
      ...newCust,
      id: `cust-${Date.now()}`
    };
    api.createCustomer(customer)
      .then(saved => setCustomers(prev => [...prev, saved]))
      .catch(err => alert('Error saving customer: ' + getErrorMessage(err)));
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    api.updateCustomer(updatedCust)
      .then(saved => setCustomers(prev => prev.map(c => c.id === saved.id ? saved : c)))
      .catch(err => alert('Error updating customer: ' + getErrorMessage(err)));
  };

  const handleDeleteCustomer = (id: string) => {
    api.deleteCustomer(id)
      .then(() => setCustomers(prev => prev.filter(c => c.id !== id)))
      .catch(err => alert('Error deleting customer: ' + getErrorMessage(err)));
  };

  // --- Pre-Order Handlers ---
  const handleAddPreOrder = (newPO: Omit<PreOrder, 'id' | 'date'>) => {
    const po: PreOrder = {
      ...newPO,
      id: `pre-${Date.now()}`,
      date: new Date().toISOString()
    };
    api.createPreOrder(po)
      .then(saved => setPreOrders(prev => [saved, ...prev]))
      .catch(err => alert('Error saving pre-order: ' + getErrorMessage(err)));
  };

  const handleUpdatePreOrder = (updatedPO: PreOrder) => {
    api.updatePreOrder(updatedPO)
      .then(saved => setPreOrders(prev => prev.map(p => p.id === saved.id ? saved : p)))
      .catch(err => alert('Error updating pre-order: ' + getErrorMessage(err)));
  };

  const handleUpdatePreOrderStatus = (id: string, status: PreOrder['status']) => {
    const po = preOrders.find(p => p.id === id);
    if (po) {
      const updated = { ...po, status };
      if (status === 'Delivered') {
        handleConvertPreOrderToSale(updated);
      } else {
        api.updatePreOrder(updated)
          .then(saved => setPreOrders(prev => prev.map(p => p.id === id ? saved : p)))
          .catch(err => alert('Error updating status: ' + getErrorMessage(err)));
      }
    }
  };

  const handleDeletePreOrder = (id: string) => {
    api.deletePreOrder(id)
      .then(() => setPreOrders(prev => prev.filter(p => p.id !== id)))
      .catch(err => alert('Error deleting pre-order: ' + getErrorMessage(err)));
  };

  // Automatic Pre-order Conversion to Completed Sale (Supports Multi-Product)
  const handleConvertPreOrderToSale = async (preOrder: PreOrder) => {
    try {
      const saleItems = [];
      for (const item of preOrder.items) {
        let targetProductId = item.productId;

        // If it's a custom product, automatically create it in the inventory first
        if (!targetProductId) {
          const newProdId = `prod-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const prefix = preOrder.category.substring(0, 3).toUpperCase();
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          
          const newProduct: Product = {
            id: newProdId,
            sku: `${prefix}-AUTO-${randomNum}`,
            name: item.productName,
            brand: 'Custom/Unknown',
            description: `Auto-created from Pre-Order #${preOrder.id}.`,
            category: preOrder.category,
            variant: item.variant,
            size: item.size,
            originalCostEur: item.originalCostEur,
            exchangeRate: item.exchangeRate,
            deliveryCostDzd: item.deliveryCostDzd,
            landedCostDzd: (item.originalCostEur * item.exchangeRate) + item.deliveryCostDzd,
            retailPriceDzd: item.priceDzd,
            quantityPurchased: item.quantity,
            quantitySold: item.quantity,
            remainingStock: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await api.createProduct(newProduct);
          targetProductId = newProdId;
        }

        saleItems.push({
          productId: targetProductId,
          productName: item.productName,
          category: preOrder.category,
          quantity: item.quantity,
          sellPriceDzd: item.priceDzd,
          baseCostDzd: 0,
          profitDzd: 0,
          exchangeRateUsed: item.exchangeRate
        });
      }

      // Calculate sale totals
      let totalRevenueDzd = 0;
      let totalBaseCostDzd = 0;
      let totalProfitDzd = 0;
      let totalProfitEur = 0;

      const enrichedItems = saleItems.map(item => {
        const prod = products.find(p => p.id === item.productId) || { landedCostDzd: 0, exchangeRate: 250 };
        const poItem = preOrder.items.find(pi => pi.productId === item.productId || (!pi.productId && item.productName === pi.productName));
        
        const landedCost = poItem ? (poItem.originalCostEur * poItem.exchangeRate) + poItem.deliveryCostDzd : prod.landedCostDzd;
        const rate = poItem ? poItem.exchangeRate : prod.exchangeRate;

        const baseCostDzd = item.quantity * landedCost;
        const itemRevenueDzd = item.quantity * item.sellPriceDzd;
        const profitDzd = itemRevenueDzd - baseCostDzd;
        const profitEur = profitDzd / rate;

        totalRevenueDzd += itemRevenueDzd;
        totalBaseCostDzd += baseCostDzd;
        totalProfitDzd += profitDzd;
        totalProfitEur += profitEur;

        return {
          ...item,
          baseCostDzd,
          profitDzd,
          exchangeRateUsed: rate
        };
      });

      const saleId = `sale-${Date.now()}`;
      const sale: Sale = {
        id: saleId,
        date: new Date().toISOString(),
        customerId: preOrder.customerId,
        customerName: preOrder.customerName,
        customerPhone: preOrder.customerPhone,
        customerAddress: preOrder.customerAddress,
        items: enrichedItems,
        totalRevenueDzd,
        totalBaseCostDzd,
        totalProfitDzd,
        totalProfitEur,
        notes: `Pre-Order Conversion. Original notes: ${preOrder.notes || 'N/A'}`
      };

      await api.createSale(sale);

      // Mark pre-order as Delivered
      const updatedPO = { ...preOrder, status: 'Delivered' as const };
      await api.updatePreOrder(updatedPO);

      // Reload all data from backend
      const refreshedProducts = await api.getProducts();
      const refreshedSales = await api.getSales();
      const refreshedPreOrders = await api.getPreOrders();

      setProducts(refreshedProducts);
      setSales(refreshedSales);
      setPreOrders(refreshedPreOrders);

      alert(`🎉 Pre-order successfully converted to a completed sale! Sourced products added to inventory.`);
      setActiveTab(preOrder.category === 'Supplements' ? 'supplements_sales' : 'snacks_sales');
    } catch (err) {
      alert('Error converting pre-order: ' + getErrorMessage(err));
    }
  };

  // Add Expense
  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const id = `exp-${Date.now()}`;
    const expense = { ...newExpense, id };
    api.createExpense(expense)
      .then(saved => setExpenses(prev => [saved, ...prev]))
      .catch(err => alert('Error saving expense: ' + getErrorMessage(err)));
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    api.deleteExpense(id)
      .then(() => setExpenses(prev => prev.filter(e => e.id !== id)))
      .catch(err => alert('Error deleting expense: ' + getErrorMessage(err)));
  };

  // Update Global Exchange Rate
  const handleUpdateExchangeRates = (newRates: ExchangeRates) => {
    api.updateSettings('exchangeRates', newRates)
      .then(() => setExchangeRates(newRates))
      .catch(err => alert('Error saving exchange rate: ' + getErrorMessage(err)));
  };

  // Update Capital Allocation
  const handleUpdateAllocation = (newAlloc: CapitalAllocation) => {
    api.updateSettings('capitalAllocation', newAlloc)
      .then(() => setCapitalAllocation(newAlloc))
      .catch(err => alert('Error saving capital allocation: ' + getErrorMessage(err)));
  };

  // Update Capital Pool Override
  const handleUpdateCapitalPoolOverride = (override: CapitalPoolOverride) => {
    api.updateSettings('capitalPoolOverride', override)
      .then(() => setCapitalPoolOverride(override))
      .catch(err => alert('Error saving capital pool override: ' + getErrorMessage(err)));
  };

  // Reset to Demo Data
  const handleResetData = () => {
    api.resetDatabase()
      .then(() => {
        alert('Database has been reset to default values.');
        window.location.reload();
      })
      .catch(err => alert('Error resetting database: ' + getErrorMessage(err)));
  };

  // Clear All Data
  const handleClearData = () => {
    api.clearDatabase()
      .then(() => {
        alert('Database has been cleared.');
        setProducts([]);
        setSales([]);
        setExpenses([]);
        setCustomers([]);
        setPreOrders([]);
      })
      .catch(err => alert('Error clearing database: ' + getErrorMessage(err)));
  };

  // Export Data (Downloads JSON file from current client state)
  const handleExportData = () => {
    const backupData = {
      products,
      sales,
      expenses,
      customers,
      preOrders,
      exchangeRates,
      capitalAllocation,
      version: '4.0',
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `poty_business_backup_v4_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Data (Sends backup JSON to backend to restore)
  const handleImportData = (data: any): boolean => {
    api.importDatabase(data)
      .then(() => {
        alert('🎉 Database restored successfully!');
        window.location.reload();
      })
      .catch(err => alert('Error restoring database: ' + getErrorMessage(err)));
    return true;
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <Layers size={22} />
          </div>
          <div className="logo-text-wrapper">
            <span className="logo-text">POTY Portal</span>
            <span className="logo-subtext">Business Management</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <div 
              className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
          </li>

          <div className="menu-section-title">Inventory Segment</div>
          
          <li>
            <div 
              className={`menu-item ${activeTab === 'Supplements' ? 'active' : ''}`}
              onClick={() => setActiveTab('Supplements')}
            >
              <Apple size={18} />
              <span>Supplements</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeTab === 'Snacks' ? 'active' : ''}`}
              onClick={() => setActiveTab('Snacks')}
            >
              <Layers size={18} />
              <span>Snacks & Fitness</span>
            </div>
          </li>

          <div className="menu-section-title">Directories</div>

          <li>
            <div 
              className={`menu-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <Users size={18} />
              <span>Customers</span>
            </div>
          </li>

          <li>
            <div 
              className={`menu-item ${activeTab === 'preorders' ? 'active' : ''}`}
              onClick={() => setActiveTab('preorders')}
            >
              <Clock size={18} />
              <span>Pre-Orders</span>
            </div>
          </li>

          <div className="menu-section-title">Transactions</div>

          <li>
            <div 
              className={`menu-item ${activeTab === 'supplements_sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('supplements_sales')}
            >
              <ShoppingBag size={18} style={{ color: '#10b981' }} />
              <span>Supplements Sales</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeTab === 'snacks_sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('snacks_sales')}
            >
              <ShoppingBag size={18} style={{ color: '#a855f7' }} />
              <span>Snacks Sales</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <DollarSign size={18} />
              <span>Global Expenses</span>
            </div>
          </li>

          <div className="menu-section-title">System</div>

          <li>
            <div 
              className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon size={18} />
              <span>Settings & Rates</span>
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="rate-info">
            <span className="rate-title">Global Rate</span>
            <span className="rate-val">1€ = {exchangeRates.global} DZD</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>
              {activeTab === 'dashboard' && 'Operations Dashboard'}
              {activeTab === 'Supplements' && 'Supplements Inventory'}
              {activeTab === 'Snacks' && 'Snacks & Fitness Foods'}
              {activeTab === 'customers' && 'Customers Directory'}
              {activeTab === 'preorders' && 'Pre-Orders Management'}
              {activeTab === 'supplements_sales' && 'Supplements Sales Tracker'}
              {activeTab === 'snacks_sales' && 'Snacks Sales Tracker'}
              {activeTab === 'expenses' && 'Global Expense Logging'}
              {activeTab === 'settings' && 'System Settings & Rates'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Aggregated business KPIs, financial health, and capital breakdown.'}
              {activeTab === 'Supplements' && 'Manage supplements, tracking variants, costs in EUR, and DZD margins.'}
              {activeTab === 'Snacks' && 'Monitor Prozis references, weight allocations, and precise unit margins.'}
              {activeTab === 'customers' && 'Manage customer profiles and view purchase histories.'}
              {activeTab === 'preorders' && 'Track custom and out-of-stock requests from customers.'}
              {activeTab === 'supplements_sales' && 'Log and track orders containing Supplement products.'}
              {activeTab === 'snacks_sales' && 'Log and track orders containing Snack & Fitness Food products.'}
              {activeTab === 'expenses' && 'Record global operational costs, ad spend, and cargo fees.'}
              {activeTab === 'settings' && 'Configure global exchange rates, capital allocations, and manage database.'}
            </p>
          </div>
        </header>

        {/* Dynamic Tab Content rendering */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            products={products} 
            sales={sales} 
            expenses={expenses}
            stats={stats}
            rates={exchangeRates}
            allocation={capitalAllocation}
            onNavigate={setActiveTab}
          />
        )}

        {['Supplements', 'Snacks'].includes(activeTab) && (
          <Inventory 
            category={activeTab as 'Supplements' | 'Snacks'}
            products={products.filter(p => p.category === activeTab && !p.archived)}
            onAddProduct={handleAddProduct}
            onAddProductsBulk={handleAddProductsBulk}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'customers' && (
          <Customers 
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {activeTab === 'preorders' && (
          <PreOrders 
            preOrders={preOrders}
            customers={customers}
            products={products.filter(p => !p.archived)}
            onAddPreOrder={handleAddPreOrder}
            onUpdatePreOrder={handleUpdatePreOrder}
            onUpdateStatus={handleUpdatePreOrderStatus}
            onDeletePreOrder={handleDeletePreOrder}
            onConvertToSale={handleConvertPreOrderToSale}
          />
        )}

        {activeTab === 'supplements_sales' && (
          <SalesTracker 
            filterCategory="Supplements"
            products={products.filter(p => p.category === 'Supplements' && !p.archived)}
            sales={sales}
            customers={customers}
            onAddSale={handleAddSale}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {activeTab === 'snacks_sales' && (
          <SalesTracker 
            filterCategory="Snacks"
            products={products.filter(p => p.category === 'Snacks' && !p.archived)}
            sales={sales}
            customers={customers}
            onAddSale={handleAddSale}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {activeTab === 'expenses' && (
          <Expenses 
            expenses={expenses}
            globalRate={exchangeRates.global}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            rates={exchangeRates}
            allocation={capitalAllocation}
            poolOverride={capitalPoolOverride}
            onUpdateRates={handleUpdateExchangeRates}
            onUpdateAllocation={handleUpdateAllocation}
            onUpdatePoolOverride={handleUpdateCapitalPoolOverride}
            onResetData={handleResetData}
            onClearData={handleClearData}
            onImportData={handleImportData}
            onExportData={handleExportData}
          />
        )}
      </main>
    </div>
  );
};

export default App;
