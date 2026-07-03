import React, { useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import type { SearchableOption } from './SearchableSelect';
import { Product, Sale, Customer } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  ShoppingBag, 
  X,
  ShoppingCart,
  Download
} from 'lucide-react';

interface SalesTrackerProps {
  filterCategory: 'Supplements' | 'Snacks';
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  onAddSale: (sale: Omit<Sale, 'id' | 'totalRevenueDzd' | 'totalBaseCostDzd' | 'totalProfitDzd' | 'totalProfitEur'>) => void;
  onDeleteSale: (saleId: string) => void;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  sellPriceDzd: number;
}

export const SalesTracker: React.FC<SalesTrackerProps> = ({
  filterCategory,
  products,
  sales,
  customers,
  onAddSale,
  onDeleteSale
}) => {
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Current Item Form State
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sellPriceDzd, setSellPriceDzd] = useState(0);

  // Order Details State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16)); // YYYY-MM-DDTHH:MM
  const [notes, setNotes] = useState('');

  // Search Ledger State
  const [searchTerm, setSearchTerm] = useState('');

  // Handle product selection to auto-populate price
  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      setSellPriceDzd(product.retailPriceDzd);
    }
  };

  // Handle customer selection to auto-fill
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    if (id) {
      const cust = customers.find(c => c.id === id);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone || '');
        setCustomerAddress(cust.address || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Add item to local cart
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      alert('Please select a product.');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Calculate total quantity of this product already in cart
    const existingCartItem = cartItems.find(item => item.productId === productId);
    const quantityInCart = existingCartItem ? existingCartItem.quantity : 0;
    const totalNewQty = quantityInCart + quantity;

    if (product.remainingStock < totalNewQty) {
      alert(`⚠️ Insufficient stock! Only ${product.remainingStock} units of ${product.name} are available. You currently have ${quantityInCart} in your cart.`);
      return;
    }

    if (existingCartItem) {
      // Update quantity of existing item in cart
      setCartItems(prev => prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: totalNewQty, sellPriceDzd } 
          : item
      ));
    } else {
      // Add new item to cart
      setCartItems(prev => [...prev, {
        productId,
        productName: product.name,
        quantity,
        sellPriceDzd
      }]);
    }

    // Reset item input fields
    setProductId('');
    setQuantity(1);
    setSellPriceDzd(0);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Submit complete order
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add at least one product before submitting.');
      return;
    }

    let finalCustomerName = customerName.trim();
    if (customerId) {
      const cust = customers.find(c => c.id === customerId);
      if (cust) finalCustomerName = cust.name;
    }

    if (!finalCustomerName) {
      alert('Please select a customer or enter a name.');
      return;
    }

    // Final stock check
    for (const item of cartItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.remainingStock < item.quantity) {
        alert(`⚠️ Stock error for "${item.productName}". Please review quantities.`);
        return;
      }
    }

    onAddSale({
      date: new Date(date).toISOString(),
      customerId: customerId || undefined,
      customerName: finalCustomerName,
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      items: cartItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          category: filterCategory,
          quantity: item.quantity,
          sellPriceDzd: item.sellPriceDzd,
          baseCostDzd: 0, // Calculated in App.tsx
          profitDzd: 0, // Calculated in App.tsx
          exchangeRateUsed: prod ? prod.exchangeRate : 250
        };
      }),
      notes: notes.trim() || undefined
    });

    // Clear cart and customer info
    setCartItems([]);
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setNotes('');
  };

  const handleRefund = (saleId: string) => {
    if (window.confirm('Refund/Delete this complete order? This will add all sold items back to their respective stock levels.')) {
      onDeleteSale(saleId);
    }
  };

  // Excel (CSV) Generation for an Order
  const handleDownloadExcel = (sale: Sale) => {
    const lines = [
      `POTY BUSINESS - ORDER INVOICE`,
      `Order ID,${sale.id}`,
      `Date,${new Date(sale.date).toLocaleDateString()} ${new Date(sale.date).toLocaleTimeString()}`,
      `Customer Name,${sale.customerName || 'Walk-in'}`,
      `Customer Phone,${sale.customerPhone || 'N/A'}`,
      `Delivery Address,${sale.customerAddress || 'N/A'}`,
      `Notes,${sale.notes || 'N/A'}`,
      ``,
      `ITEMIZED BILL`,
      `Product Name,Quantity,Unit Price (DZD),Total Price (DZD)`
    ];

    sale.items.forEach(item => {
      lines.push(`"${item.productName}",${item.quantity},${item.sellPriceDzd},${item.quantity * item.sellPriceDzd}`);
    });

    lines.push(``);
    lines.push(`Grand Total (DZD),${sale.totalRevenueDzd}`);
    lines.push(`Total Benefits (DZD),${sale.totalProfitDzd}`);
    lines.push(`Total Benefits (EUR),${sale.totalProfitEur.toFixed(2)}`);

    const csvContent = '\uFEFF' + lines.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_${sale.id}_${sale.customerName || 'walkin'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter sales belonging to the active category
  const filteredSales = sales
    .filter(s => {
      const belongsToCategory = s.items.some(item => item.category === filterCategory);
      
      const matchesSearch = s.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase())) || 
                            (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return belongsToCategory && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Products available to sell in this category (with stock)
  const availableProducts = products.filter(p => p.remainingStock > 0);

  // Build SearchableSelect options for products
  const productOptions: SearchableOption[] = availableProducts.map(p => ({
    value: p.id,
    label: p.name,
    sublabel: `${p.brand} · ${p.variant} · ${p.size}`,
    badge: `Stock: ${p.remainingStock}`,
    badgeColor: p.remainingStock === 0 ? 'danger' : p.remainingStock <= 3 ? 'warning' : 'success',
    disabled: p.remainingStock === 0,
  }));

  return (
    <div className="fade-in-section">
      <div className="transaction-flow-grid">
        {/* Left Side: Create Multi-Product Order */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add Item to Order Form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="var(--primary)" />
              Add Items to Order
            </h3>

            <form onSubmit={handleAddToCart}>
              {/* Product Select */}
              <div className="form-group">
                <label htmlFor="sale-product">Select Product</label>
                <SearchableSelect
                  id="sale-product"
                  options={productOptions}
                  value={productId}
                  onChange={handleProductChange}
                  placeholder={`-- Choose ${filterCategory} --`}
                  required
                />
              </div>

              {/* Qty & Price */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sale-quantity">Qty</label>
                  <input 
                    type="number" 
                    id="sale-quantity" 
                    className="form-control"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sale-price">Price (DZD)</label>
                  <input 
                    type="number" 
                    id="sale-price" 
                    className="form-control"
                    min="0"
                    value={sellPriceDzd || ''}
                    onChange={(e) => setSellPriceDzd(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                <Plus size={16} /> Add to Cart
              </button>
            </form>
          </div>

          {/* Cart & Checkout */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} color="var(--success)" />
              Current Order Cart ({cartItems.length} items)
            </h3>

            {cartItems.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Cart is empty. Add products above.
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit}>
                {/* Cart Table */}
                <div className="table-container" style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={index}>
                          <td style={{ fontWeight: 600 }}>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.sellPriceDzd.toLocaleString()} DZD</td>
                          <td style={{ fontWeight: 700 }}>{(item.quantity * item.sellPriceDzd).toLocaleString()} DZD</td>
                          <td>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-icon" 
                              style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--danger)' }}
                              onClick={() => handleRemoveFromCart(index)}
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
                        <td colSpan={3}>Order Total:</td>
                        <td colSpan={2} style={{ color: 'var(--success)', fontSize: '0.95rem' }}>
                          {cartItems.reduce((acc, item) => acc + (item.quantity * item.sellPriceDzd), 0).toLocaleString()} DZD
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Checkout Fields */}
                <div className="form-group">
                  <label htmlFor="checkout-customer">Select Customer Profile</label>
                  <select 
                    id="checkout-customer" 
                    className="form-control"
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                  >
                    <option value="">-- New Customer / Walk-in --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No Phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customer-name">Customer Name</label>
                    <input 
                      type="text" 
                      id="customer-name" 
                      className="form-control"
                      placeholder="Customer Name"
                      required
                      disabled={!!customerId}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="customer-phone">Phone</label>
                    <input 
                      type="text" 
                      id="customer-phone" 
                      className="form-control"
                      placeholder="Phone Number"
                      disabled={!!customerId}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="customer-address">Delivery Address</label>
                  <input 
                    type="text" 
                    id="customer-address" 
                    className="form-control"
                    placeholder="Address"
                    disabled={!!customerId}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sale-date">Order Date & Time</label>
                  <input 
                    type="datetime-local" 
                    id="sale-date" 
                    className="form-control"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sale-notes">Order Notes</label>
                  <textarea 
                    id="sale-notes" 
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Free shipping, gift wrap"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                  Submit Complete Order
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Sales Ledger */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} color="var(--success)" />
              {filterCategory} Sales Ledger
            </h3>

            <div className="search-input-wrapper" style={{ maxWidth: '200px' }}>
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search ledger..." 
                className="form-control"
                style={{ padding: '6px 12px 6px 36px', fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No {filterCategory.toLowerCase()} sales logged.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '650px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order Items</th>
                    <th>Revenue</th>
                    <th>Net Profit (DZD / EUR)</th>
                    <th>Customer</th>
                    <th style={{ width: '90px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr key={sale.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div>{new Date(sale.date).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {sale.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.8rem' }}>
                              <span style={{ fontWeight: 600 }}>{item.productName}</span> 
                              <span style={{ color: 'var(--text-muted)' }}> (x{item.quantity})</span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                Price: {item.sellPriceDzd.toLocaleString()} DZD
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700 }}>
                        {sale.totalRevenueDzd.toLocaleString()} DZD
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-success font-semibold">
                            +{sale.totalProfitDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ≈ +{sale.totalProfitEur.toFixed(2)} €
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {sale.customerName ? (
                            <div style={{ fontWeight: 600 }}>{sale.customerName}</div>
                          ) : <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>}
                          {sale.customerPhone && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {sale.customerPhone}
                            </div>
                          )}
                          {sale.notes && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '4px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sale.notes}>
                              Note: {sale.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-icon"
                            style={{ padding: '6px' }}
                            onClick={() => handleDownloadExcel(sale)}
                            title="Download Invoice Excel (CSV)"
                          >
                            <Download size={13} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '6px' }}
                            onClick={() => handleRefund(sale.id)}
                            title="Delete / Refund entire order"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
export default SalesTracker;
