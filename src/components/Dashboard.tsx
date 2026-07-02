import React from 'react';
import { Product, Sale, Expense, ExchangeRates, CapitalAllocation, DashboardStats } from '../types';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  ShoppingBag,
  Coins
} from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stats: DashboardStats;
  rates: ExchangeRates;
  allocation: CapitalAllocation;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  sales,
  expenses,
  stats,
  rates,
  allocation,
  onNavigate
}) => {
  // Get lowest stock items
  const lowStockItems = [...products]
    .filter(p => !p.archived && p.remainingStock <= 3)
    .sort((a, b) => a.remainingStock - b.remainingStock)
    .slice(0, 5);

  // Get recent sales (orders)
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Financial calculations
  const recoveredCapitalDzd = sales.reduce((acc, s) => acc + s.totalBaseCostDzd, 0);
  
  const remainingInventoryCapitalDzd = products
    .filter(p => !p.archived)
    .reduce((acc, p) => acc + (p.remainingStock * p.landedCostDzd), 0);
  
  const totalExpensesDzd = expenses.reduce((acc, e) => acc + e.amountDzd, 0);
  const netProfitDzd = stats.totalProfitDzd;

  // Taken Aside & Reinvested
  const hasProfit = netProfitDzd > 0;
  const takenAsideDzd = hasProfit ? netProfitDzd * (allocation.takenAsidePercent / 100) : 0;
  const reinvestedDzd = hasProfit ? netProfitDzd * (allocation.reinvestedPercent / 100) : 0;

  // Convert to EUR for secondary display
  // We sum up the EUR cost of sold items (based on their historical rates)
  const recoveredCapitalEur = sales.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + (item.baseCostDzd / item.exchangeRateUsed), 0);
  }, 0);

  const remainingInventoryCapitalEur = products
    .filter(p => !p.archived)
    .reduce((acc, p) => acc + (p.remainingStock * (p.originalCostEur + (p.deliveryCostDzd / p.exchangeRate))), 0);
    
  const totalExpensesEur = expenses.reduce((acc, e) => acc + e.amountEur, 0);
  const takenAsideEur = takenAsideDzd / rates.global;
  const reinvestedEur = reinvestedDzd / rates.global;

  // Category performance (Only Supplements & Snacks)
  const categories = ['Supplements', 'Snacks'];
  const categoryStats = categories.map(cat => {
    const catProducts = products.filter(p => p.category === cat && !p.archived);

    // Sum up items in all sales that belong to this category
    let revenue = 0;
    let costOfGoodsSold = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.category === cat) {
          revenue += item.quantity * item.sellPriceDzd;
          costOfGoodsSold += item.baseCostDzd;
        }
      });
    });

    const profit = revenue - costOfGoodsSold;
    const stockValue = catProducts.reduce((acc, p) => acc + (p.remainingStock * p.landedCostDzd), 0);
    const stockQty = catProducts.reduce((acc, p) => acc + p.remainingStock, 0);

    return {
      name: cat,
      revenue,
      profit,
      stockValue,
      stockQty
    };
  });

  // Calculate percentages for the stacked bar
  const totalCapitalPool = recoveredCapitalDzd + remainingInventoryCapitalDzd + totalExpensesDzd + (hasProfit ? netProfitDzd : 0);
  
  const getPercent = (value: number) => {
    if (totalCapitalPool <= 0) return 0;
    return (value / totalCapitalPool) * 100;
  };

  const pctRecovered = getPercent(recoveredCapitalDzd);
  const pctRemaining = getPercent(remainingInventoryCapitalDzd);
  const pctExpenses = getPercent(totalExpensesDzd);
  const pctTakenAside = hasProfit ? getPercent(takenAsideDzd) : 0;
  const pctReinvested = hasProfit ? getPercent(reinvestedDzd) : 0;

  return (
    <div className="fade-in-section">
      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Total Invested */}
        <div className="glass-card stat-card blue">
          <div className="stat-header">
            <span className="stat-title">Total Invested (Capital Pool)</span>
            <div className="stat-icon">
              <Coins size={20} />
            </div>
          </div>
          <div className="stat-value">
            {stats.totalInvestedDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="currency-label">DZD</span>
          </div>
          <div className="stat-value-sub">
            ≈ {stats.totalInvestedEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="stat-desc">Inventory Sourcing + Expenses</div>
        </div>

        {/* Total Revenue */}
        <div className="glass-card stat-card green">
          <div className="stat-header">
            <span className="stat-title">Total Sales Revenue</span>
            <div className="stat-icon">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="stat-value">
            {stats.totalRevenueDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="currency-label">DZD</span>
          </div>
          <div className="stat-value-sub">
            {sales.length} orders logged
          </div>
          <div className="stat-desc">Cash generated from local sales</div>
        </div>

        {/* Ad Spend / Marketing */}
        <div className="glass-card stat-card orange">
          <div className="stat-header">
            <span className="stat-title">Ad Spend & Cargo Costs</span>
            <div className="stat-icon">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value">
            {(stats.totalAdSpendDzd + stats.totalCargoDzd).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="currency-label">DZD</span>
          </div>
          <div className="stat-value-sub">
            Ads: {stats.totalAdSpendDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD • Cargo: {stats.totalCargoDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD
          </div>
          <div className="stat-desc">Global business operating costs</div>
        </div>

        {/* Net Profit */}
        <div className="glass-card stat-card purple">
          <div className="stat-header">
            <span className="stat-title">Net Profit / Benefits</span>
            <div className="stat-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className={`stat-value ${netProfitDzd >= 0 ? 'text-success' : 'text-danger'}`}>
            {netProfitDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="currency-label">DZD</span>
          </div>
          <div className="stat-value-sub">
            ≈ {stats.totalProfitEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="stat-desc">Deducting product cost + expenses</div>
        </div>
      </div>

      {/* Capital Allocation & Financial Health */}
      <div className="glass-card financial-health-card">
        <h3>Capital Flow & Business Health</h3>
        <p className="section-description">
          Visualizing how your total capital pool is currently distributed across the business.
        </p>

        {totalCapitalPool === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No financial data recorded yet. Log sales and inventory to see capital flows.
          </div>
        ) : (
          <div>
            {/* Horizontal Stacked Bar */}
            <div className="capital-bar-wrapper">
              <div className="capital-bar">
                {pctRecovered > 0 && (
                  <div 
                    className="bar-segment recovered" 
                    style={{ width: `${pctRecovered}%` }}
                    title={`Recovered Capital: ${recoveredCapitalDzd.toLocaleString()} DZD`}
                  ></div>
                )}
                {pctRemaining > 0 && (
                  <div 
                    className="bar-segment remaining" 
                    style={{ width: `${pctRemaining}%` }}
                    title={`Tied in Stock: ${remainingInventoryCapitalDzd.toLocaleString()} DZD`}
                  ></div>
                )}
                {pctExpenses > 0 && (
                  <div 
                    className="bar-segment expenses" 
                    style={{ width: `${pctExpenses}%` }}
                    title={`Expenses: ${totalExpensesDzd.toLocaleString()} DZD`}
                  ></div>
                )}
                {pctTakenAside > 0 && (
                  <div 
                    className="bar-segment taken-aside" 
                    style={{ width: `${pctTakenAside}%` }}
                    title={`Taken Aside: ${takenAsideDzd.toLocaleString()} DZD`}
                  ></div>
                )}
                {pctReinvested > 0 && (
                  <div 
                    className="bar-segment reinvested" 
                    style={{ width: `${pctReinvested}%` }}
                    title={`Reinvested Capital: ${reinvestedDzd.toLocaleString()} DZD`}
                  ></div>
                )}
              </div>
            </div>

            {/* Legend Grid */}
            <div className="capital-legend-grid">
              <div className="legend-item">
                <span className="legend-dot recovered"></span>
                <div className="legend-info">
                  <span className="legend-label">Recovered Capital (Sold Goods)</span>
                  <span className="legend-value">{recoveredCapitalDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD <span className="legend-val-eur">({recoveredCapitalEur.toFixed(0)}€)</span></span>
                  <span className="legend-pct">{pctRecovered.toFixed(1)}% of pool</span>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot remaining"></span>
                <div className="legend-info">
                  <span className="legend-label">Tied Capital (Remaining Stock)</span>
                  <span className="legend-value">{remainingInventoryCapitalDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD <span className="legend-val-eur">({remainingInventoryCapitalEur.toFixed(0)}€)</span></span>
                  <span className="legend-pct">{pctRemaining.toFixed(1)}% of pool</span>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot expenses"></span>
                <div className="legend-info">
                  <span className="legend-label">Paid Expenses</span>
                  <span className="legend-value">{totalExpensesDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD <span className="legend-val-eur">({totalExpensesEur.toFixed(0)}€)</span></span>
                  <span className="legend-pct">{pctExpenses.toFixed(1)}% of pool</span>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot taken-aside"></span>
                <div className="legend-info">
                  <span className="legend-label">Taken Aside (Profit Draw)</span>
                  <span className="legend-value">{takenAsideDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD <span className="legend-val-eur">({takenAsideEur.toFixed(0)}€)</span></span>
                  <span className="legend-pct">{pctTakenAside.toFixed(1)}% ({allocation.takenAsidePercent}% of Net Profit)</span>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot reinvested"></span>
                <div className="legend-info">
                  <span className="legend-label">Reinvested Capital (Profit Roll)</span>
                  <span className="legend-value">{reinvestedDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD <span className="legend-val-eur">({reinvestedEur.toFixed(0)}€)</span></span>
                  <span className="legend-pct">{pctReinvested.toFixed(1)}% ({allocation.reinvestedPercent}% of Net Profit)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Side: Category Performance */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--primary)" />
            Category-Level Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
            {categoryStats.map(cat => {
              const profitMargin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
              return (
                <div key={cat.name} className="category-perf-row" onClick={() => onNavigate(cat.name)}>
                  <div className="cat-perf-header">
                    <span className="cat-perf-name">{cat.name === 'Snacks' ? 'Snacks & Fitness' : cat.name}</span>
                    <span className="cat-perf-qty">{cat.stockQty} items in stock</span>
                  </div>
                  
                  {/* Progress bar representing profit vs revenue */}
                  <div className="cat-perf-bar-bg">
                    <div 
                      className="cat-perf-bar-fill" 
                      style={{ 
                        width: `${Math.max(5, Math.min(100, cat.revenue > 0 ? (cat.profit / Math.max(...categoryStats.map(c => c.profit || 1))) * 100 : 0))}%`,
                        background: 'linear-gradient(to right, var(--primary), var(--accent))'
                      }}
                    ></div>
                  </div>

                  <div className="cat-perf-footer">
                    <div>
                      <span className="label">Revenue: </span>
                      <span className="val">{cat.revenue.toLocaleString()} DZD</span>
                    </div>
                    <div>
                      <span className="label">Profit: </span>
                      <span className="val text-success">+{cat.profit.toLocaleString()} DZD</span>
                      {profitMargin > 0 && <span className="margin-tag">({profitMargin.toFixed(0)}% margin)</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Stock Alerts & Recent Sales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Low Stock Alerts */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--warning)" />
                Low Stock Alerts
              </h3>
              {lowStockItems.length > 0 && (
                <span className="badge badge-danger">{lowStockItems.length} items</span>
              )}
            </div>

            {lowStockItems.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                🎉 All items are sufficiently stocked!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lowStockItems.map(item => (
                  <div key={item.id} className="mini-alert-row" onClick={() => onNavigate(item.category)}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.category} • {item.variant} ({item.size})
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '0.85rem',
                        color: item.remainingStock === 0 ? 'var(--danger)' : 'var(--warning)' 
                      }}>
                        {item.remainingStock} left
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        of {item.quantityPurchased}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="glass-card" style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--success)" />
                Recent Sales
              </h3>
            </div>

            {recentSales.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No sales logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentSales.map(sale => (
                  <div key={sale.id} className="mini-sale-row" onClick={() => onNavigate(sale.items[0]?.category === 'Supplements' ? 'supplements_sales' : 'snacks_sales')}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(sale.date).toLocaleDateString()} • {sale.customerName || 'Walk-in'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>
                        +{sale.totalRevenueDzd.toLocaleString()} DZD
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Profit: +{sale.totalProfitDzd.toLocaleString()} DZD
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
