import React, { useState } from 'react';
import { Expense } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  TrendingDown
} from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  globalRate: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({
  expenses,
  globalRate,
  onAddExpense,
  onDeleteExpense
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Ad Spend' | 'Cargo/Shipping' | 'Operational' | 'Other'>('Ad Spend');
  const [currency, setCurrency] = useState<'EUR' | 'DZD'>('EUR');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [notes, setNotes] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert('Please enter a valid title and amount.');
      return;
    }

    let amountEur = 0;
    let amountDzd = 0;

    if (currency === 'EUR') {
      amountEur = amount;
      amountDzd = amount * globalRate;
    } else {
      amountDzd = amount;
      amountEur = amount / globalRate;
    }

    onAddExpense({
      title: title.trim(),
      category,
      amountEur,
      amountDzd,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined
    });

    // Reset form
    setTitle('');
    setAmount(0);
    setNotes('');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete expense "${name}"? This will update your net profit calculations.`)) {
      onDeleteExpense(id);
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses
    .filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate totals
  const totalDzd = filteredExpenses.reduce((acc, e) => acc + e.amountDzd, 0);
  const totalEur = filteredExpenses.reduce((acc, e) => acc + e.amountEur, 0);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Ad Spend':
        return <span className="badge badge-warning" style={{ padding: '4px 8px' }}>Ad Spend</span>;
      case 'Cargo/Shipping':
        return <span className="badge badge-info" style={{ padding: '4px 8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>Cargo & Shipping</span>;
      case 'Operational':
        return <span className="badge badge-secondary" style={{ padding: '4px 8px' }}>Operational</span>;
      default:
        return <span className="badge badge-primary" style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>Other</span>;
    }
  };

  return (
    <div className="fade-in-section">
      <div className="transaction-flow-grid">
        {/* Left Side: Log Expense Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={20} color="var(--danger)" />
            Log Global Expense
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group">
              <label htmlFor="exp-title">Expense Title</label>
              <input 
                type="text" 
                id="exp-title" 
                className="form-control"
                required
                placeholder="e.g. Meta Ads - July campaign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Category & Currency */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="exp-category">Category</label>
                <select 
                  id="exp-category" 
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="Ad Spend">Ad Spend / Marketing</option>
                  <option value="Cargo/Shipping">Cargo / Shipping Fees</option>
                  <option value="Operational">Operational Costs</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="exp-currency">Currency</label>
                <select 
                  id="exp-currency" 
                  className="form-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="DZD">Algerian Dinar (DZD)</option>
                </select>
              </div>
            </div>

            {/* Amount & Date */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="exp-amount">Amount</label>
                <input 
                  type="number" 
                  id="exp-amount" 
                  className="form-control"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="exp-date">Date</label>
                <input 
                  type="date" 
                  id="exp-date" 
                  className="form-control"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Currency Conversion Preview */}
            {amount > 0 && (
              <div className="conversion-preview">
                {currency === 'EUR' ? (
                  <span>
                    Converts to: <strong>{(amount * globalRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD</strong> 
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>(Rate: {globalRate})</span>
                  </span>
                ) : (
                  <span>
                    Converts to: <strong>{(amount / globalRate).toFixed(2)} EUR (€)</strong> 
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>(Rate: {globalRate})</span>
                  </span>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="exp-notes">Description / Notes</label>
              <textarea 
                id="exp-notes" 
                className="form-control"
                rows={3}
                placeholder="Details about this cost..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              <Plus size={18} />
              Log Expense
            </button>
          </form>
        </div>

        {/* Right Side: Expense History */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingDown size={20} color="var(--danger)" />
                Expense Ledger
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Total: <strong className="text-danger">{totalDzd.toLocaleString()} DZD</strong> (≈ {totalEur.toFixed(0)}€)
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="search-input-wrapper" style={{ maxWidth: '180px' }}>
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  className="form-control"
                  style={{ padding: '6px 12px 6px 36px', fontSize: '0.8rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select 
                className="form-control" 
                style={{ width: '120px', padding: '6px 12px', fontSize: '0.8rem' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Ad Spend">Ad Spend</option>
                <option value="Cargo/Shipping">Cargo</option>
                <option value="Operational">Operational</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No expenses logged matching the filters.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Title</th>
                    <th>Category</th>
                    <th>Amount (DZD)</th>
                    <th>Amount (€)</th>
                    <th>Notes</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{exp.title}</td>
                      <td>{getCategoryBadge(exp.category)}</td>
                      <td className="font-mono text-danger" style={{ fontWeight: 600 }}>
                        -{exp.amountDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                        -{exp.amountEur.toFixed(2)} €
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.notes}>
                        {exp.notes || '—'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger btn-icon"
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '6px' }}
                          onClick={() => handleDelete(exp.id, exp.title)}
                          title="Delete expense"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Expenses;
