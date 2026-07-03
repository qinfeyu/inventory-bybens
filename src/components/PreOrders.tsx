import React, { useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { PreOrder, Customer, Product, PreOrderItem } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  X,
  Download,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';

interface PreOrdersProps {
  preOrders: PreOrder[];
  customers: Customer[];
  products: Product[];
  onAddPreOrder: (preOrder: Omit<PreOrder, 'id' | 'date'>) => void;
  onUpdatePreOrder: (preOrder: PreOrder) => void;
  onUpdateStatus: (id: string, status: PreOrder['status']) => void;
  onDeletePreOrder: (id: string) => void;
  onConvertToSale: (preOrder: PreOrder) => void;
}

export const PreOrders: React.FC<PreOrdersProps> = ({
  preOrders,
  customers,
  products,
  onAddPreOrder,
  onUpdatePreOrder,
  onUpdateStatus,
  onDeletePreOrder,
  onConvertToSale
}) => {
  // Pre-order Cart State
  const [preOrderItems, setPreOrderItems] = useState<PreOrderItem[]>([]);

  // Item Form State
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [variant, setVariant] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [originalCostEur, setOriginalCostEur] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(250);
  const [deliveryCostDzd, setDeliveryCostDzd] = useState(0);
  const [priceDzd, setPriceDzd] = useState(0);

  // Customer & Order Metadata State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [category, setCategory] = useState<'Supplements' | 'Snacks'>('Supplements');
  const [notes, setNotes] = useState('');

  // Editing State
  const [editingPreOrder, setEditingPreOrder] = useState<PreOrder | null>(null);

  // UI Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Download Config Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(null);

  // Expandable Order Items State
  const [expandedPreOrders, setExpandedPreOrders] = useState<Record<string, boolean>>({});

  const togglePreOrderItems = (id: string) => {
    setExpandedPreOrders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleProductChange = (id: string) => {
    setProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setProductName(prod.name);
      setVariant(prod.variant);
      setSize(prod.size);
      setOriginalCostEur(prod.originalCostEur);
      setExchangeRate(prod.exchangeRate);
      setDeliveryCostDzd(prod.deliveryCostDzd);
      setPriceDzd(prod.retailPriceDzd);
    }
  };

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

  // Add Item to Pre-order Cart
  const handleAddItemToCart = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = productName.trim();
    if (!isCustomProduct && productId) {
      const prod = products.find(p => p.id === productId);
      if (prod) finalName = prod.name;
    }

    if (!finalName) {
      alert('Please enter or select a product name.');
      return;
    }

    const newItem: PreOrderItem = {
      productId: isCustomProduct ? undefined : productId || undefined,
      productName: finalName,
      variant: variant.trim() || 'Default',
      size: size.trim() || 'N/A',
      quantity,
      originalCostEur,
      exchangeRate,
      deliveryCostDzd,
      priceDzd
    };

    setPreOrderItems(prev => [...prev, newItem]);

    // Reset item inputs
    setProductId('');
    setProductName('');
    setVariant('');
    setSize('');
    setQuantity(1);
    setOriginalCostEur(0);
    setExchangeRate(250);
    setDeliveryCostDzd(0);
    setPriceDzd(0);
  };

  const handleRemoveItemFromCart = (index: number) => {
    setPreOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Pre-Order (Creates or Updates)
  const handlePreOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preOrderItems.length === 0) {
      alert('Pre-order cart is empty. Add at least one item.');
      return;
    }

    let finalCustomerName = customerName.trim();
    if (customerId) {
      const cust = customers.find(c => c.id === customerId);
      if (cust) finalCustomerName = cust.name;
    }

    if (!finalCustomerName) {
      alert('Please select or enter a customer name.');
      return;
    }

    // Calculate totals
    let totalRevenueDzd = 0;
    let totalDeliveryDzd = 0;
    let totalCostDzd = 0;

    preOrderItems.forEach(item => {
      totalRevenueDzd += item.quantity * item.priceDzd;
      totalDeliveryDzd += item.quantity * item.deliveryCostDzd;
      totalCostDzd += item.quantity * ((item.originalCostEur * item.exchangeRate) + item.deliveryCostDzd);
    });

    const totalProfitDzd = totalRevenueDzd - totalCostDzd;

    if (editingPreOrder) {
      onUpdatePreOrder({
        ...editingPreOrder,
        customerId: customerId || undefined,
        customerName: finalCustomerName,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        category,
        items: preOrderItems,
        totalRevenueDzd,
        totalDeliveryDzd,
        totalCostDzd,
        totalProfitDzd,
        notes: notes.trim() || undefined
      });
      alert('🎉 Pre-order updated successfully!');
    } else {
      onAddPreOrder({
        customerId: customerId || undefined,
        customerName: finalCustomerName,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        category,
        items: preOrderItems,
        totalRevenueDzd,
        totalDeliveryDzd,
        totalCostDzd,
        totalProfitDzd,
        status: 'Pending',
        notes: notes.trim() || undefined
      });
    }

    handleCloseModal();
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingPreOrder(null);
    setPreOrderItems([]);
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (po: PreOrder) => {
    setEditingPreOrder(po);
    setPreOrderItems(po.items || []);
    setCustomerId(po.customerId || '');
    setCustomerName(po.customerName);
    setCustomerPhone(po.customerPhone || '');
    setCustomerAddress(po.customerAddress || '');
    setCategory(po.category);
    setNotes(po.notes || '');
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setPreOrderItems([]);
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setNotes('');
    setEditingPreOrder(null);
    setIsAddModalOpen(false);
  };

  // Trigger Download Modal
  const openDownloadModal = (po: PreOrder) => {
    setSelectedPreOrder(po);
    setIsDownloadModalOpen(true);
  };

  // Trigger file download
  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Customer Invoice (Option 1 - Picture 1)
  const downloadCustomerInvoice = () => {
    if (!selectedPreOrder) return;
    const po = selectedPreOrder;

    const lines = [
      `POTY BUSINESS - CUSTOMER INVOICE`,
      `Pre-Order ID,${po.id}`,
      `Date,${new Date(po.date).toLocaleDateString()}`,
      `Customer Name,${po.customerName}`,
      `Customer Phone,${po.customerPhone || 'N/A'}`,
      `Delivery Address,${po.customerAddress || 'N/A'}`,
      `Notes,${po.notes || 'N/A'}`,
      ``,
      `Product Name,Variant,Size,Quantity,Unit Retail Price (DZD),Total Retail Price (DZD)`
    ];

    (po.items || []).forEach(item => {
      lines.push(`"${item.productName}","${item.variant}","${item.size}",${item.quantity},${item.priceDzd},${item.quantity * item.priceDzd}`);
    });

    lines.push(``);
    // Align totals to Col 3 (C) by using double commas (Col 1: Name, Col 2: empty, Col 3: Value)
    lines.push(`Total Items,,${(po.items || []).reduce((acc, i) => acc + i.quantity, 0)}`);
    lines.push(`Total Price (DZD),,${po.totalRevenueDzd}`);

    const csvContent = '\uFEFF' + lines.join('\n');
    triggerDownload(csvContent, `invoice_customer_${po.id}_${po.customerName.replace(/\s+/g, '_')}.csv`);
    setIsDownloadModalOpen(false);
  };

  // Generate Delivery Sheet (Option 2 - Picture 2)
  const downloadDeliverySheet = () => {
    if (!selectedPreOrder) return;
    const po = selectedPreOrder;

    const lines = [
      `Product Name,Variant,Size,Quantity,Unit Delivery Cost (DZD),Total Delivery Cost (DZD)`
    ];

    (po.items || []).forEach(item => {
      lines.push(`"${item.productName}","${item.variant}","${item.size}",${item.quantity},${item.deliveryCostDzd},${item.quantity * item.deliveryCostDzd}`);
    });

    lines.push(``);
    // Align totals to Col 3 (C) by using double commas
    lines.push(`Total Items,,${(po.items || []).reduce((acc, i) => acc + i.quantity, 0)}`);
    lines.push(`Total Price (DZD),,${po.totalRevenueDzd}`);
    lines.push(`Total Delivery Cost (DZD),,${po.totalDeliveryDzd}`);

    const csvContent = '\uFEFF' + lines.join('\n');
    triggerDownload(csvContent, `delivery_sheet_${po.id}_${po.customerName.replace(/\s+/g, '_')}.csv`);
    setIsDownloadModalOpen(false);
  };

  const getStatusBadge = (status: PreOrder['status']) => {
    switch (status) {
      case 'Pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'Sourced':
        return <span className="badge badge-info">Sourced</span>;
      case 'Arrived':
        return <span className="badge badge-primary">Arrived</span>;
      case 'Delivered':
        return <span className="badge badge-success">Delivered</span>;
      case 'Cancelled':
        return <span className="badge badge-secondary" style={{ textDecoration: 'line-through' }}>Cancelled</span>;
      default:
        return null;
    }
  };

  const filteredPreOrders = preOrders
    .filter(p => {
      const matchesSearch = p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.items || []).some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fade-in-section">
      {/* Action Bar */}
      <div className="search-filter-bar">
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '550px' }}>
          <div className="search-input-wrapper" style={{ flexGrow: 1 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search pre-orders by customer or product..." 
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="form-control" 
            style={{ width: '140px', padding: '8px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Sourced">Sourced</option>
            <option value="Arrived">Arrived</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          New Pre-Order
        </button>
      </div>

      {/* Pre-Orders Table */}
      <div className="glass-card">
        {filteredPreOrders.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No pre-orders logged matching the filters.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Order Items</th>
                  <th>Category</th>
                  <th>Total Delivery</th>
                  <th>Cost (No Benefits)</th>
                  <th>Retail (With Benefits)</th>
                  <th>Status</th>
                  <th style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPreOrders.map(po => {
                  const isDelivered = po.status === 'Delivered';
                  const isArrived = po.status === 'Arrived';
                  const isCancelled = po.status === 'Cancelled';

                  return (
                    <tr key={po.id} style={{ opacity: isCancelled ? 0.6 : 1 }}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(po.date).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.customerName}</div>
                        {po.customerPhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {po.customerPhone}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          {expandedPreOrders[po.id] ? (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                                onClick={() => togglePreOrderItems(po.id)}
                              >
                                <EyeOff size={12} />
                                Hide Items
                              </button>
                              <div style={{ 
                                background: 'rgba(255, 255, 255, 0.02)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '6px', 
                                padding: '8px',
                                marginTop: '4px',
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '6px',
                                minWidth: '180px'
                              }}>
                                {(po.items || []).map((item, idx) => (
                                  <div key={idx} style={{ fontSize: '0.75rem', borderBottom: idx < po.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: idx < po.items.length - 1 ? '4px' : '0' }}>
                                    <div><span style={{ fontWeight: 600 }}>{item.productName}</span> <span style={{ color: 'var(--primary)' }}>x{item.quantity}</span></div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {item.variant} • {item.size}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                              onClick={() => togglePreOrderItems(po.id)}
                            >
                              <Eye size={12} />
                              Show Items ({(po.items || []).length})
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{po.category}</span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                        {po.totalDeliveryDzd.toLocaleString()} DZD
                      </td>
                      <td className="font-mono text-secondary" style={{ fontSize: '0.85rem' }}>
                        {po.totalCostDzd.toLocaleString()} DZD
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {po.totalRevenueDzd.toLocaleString()} DZD
                      </td>
                      <td>
                        {isDelivered || isCancelled ? (
                          getStatusBadge(po.status)
                        ) : (
                          <select 
                            className="form-control" 
                            style={{ width: '110px', padding: '4px 8px', fontSize: '0.8rem', height: '32px' }}
                            value={po.status}
                            onChange={(e) => onUpdateStatus(po.id, e.target.value as any)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Sourced">Sourced</option>
                            <option value="Arrived">Arrived</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {isArrived && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                              onClick={() => onConvertToSale(po)}
                              title="Deliver and log as completed sale"
                            >
                              Deliver
                            </button>
                          )}

                          <button 
                            className="btn btn-secondary btn-icon" 
                            style={{ padding: '6px' }}
                            onClick={() => handleOpenEditModal(po)}
                            title="Edit pre-order"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button 
                            className="btn btn-secondary btn-icon" 
                            style={{ padding: '6px' }}
                            onClick={() => openDownloadModal(po)}
                            title="Download Pre-Order Sheets"
                          >
                            <Download size={13} />
                          </button>

                          <button 
                            className="btn btn-danger btn-icon" 
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '6px' }}
                            onClick={() => onDeletePreOrder(po.id)}
                            title="Delete pre-order"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New / Edit Pre-Order Modal (with Cart System) */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container glass-card" style={{ maxWidth: '1050px' }}>
            <div className="modal-header">
              <h2>{editingPreOrder ? `Edit Pre-Order #${editingPreOrder.id}` : 'Log New Pre-Order'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <div className="transaction-flow-grid" style={{ gridTemplateColumns: '1fr 1.45fr', gap: '24px', padding: '10px 0' }}>
              {/* Left Side: Add Item to Pre-Order Cart */}
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Add Products to Pre-Order
                </h4>
                <form onSubmit={handleAddItemToCart} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Category */}
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem' }}>Pre-Order Segment</label>
                    <select 
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      <option value="Supplements">Supplements</option>
                      <option value="Snacks">Snacks & Fitness Foods</option>
                    </select>
                  </div>

                  {/* Custom Checkbox */}
                  <div style={{ display: 'flex', gap: '12px', margin: '4px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isCustomProduct}
                        onChange={(e) => {
                          setIsCustomProduct(e.target.checked);
                          setProductId('');
                          setProductName('');
                          setVariant('');
                          setSize('');
                          setOriginalCostEur(0);
                          setDeliveryCostDzd(0);
                          setPriceDzd(0);
                        }}
                      />
                      Custom / Out-of-Stock Product (Not in Inventory)
                    </label>
                  </div>

                  {isCustomProduct ? (
                    <>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.75rem' }}>Product Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="e.g. Prozis Whey Protein"
                          required
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                        />
                      </div>
                      <div className="form-row" style={{ gap: '10px', marginBottom: '8px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem' }}>Variant</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="e.g. Vanilla"
                            value={variant}
                            onChange={(e) => setVariant(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem' }}>Size</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="e.g. 2 kg"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Select Product</label>
                      <SearchableSelect
                        options={products
                          .filter(p => p.category === category)
                          .map(p => ({
                            value: p.id,
                            label: p.name,
                            sublabel: `${p.brand} · ${p.variant} · ${p.size}`,
                            badge: p.remainingStock > 0 ? `Stock: ${p.remainingStock}` : 'Out of Stock',
                            badgeColor: (p.remainingStock === 0 ? 'danger' : p.remainingStock <= 3 ? 'warning' : 'success') as 'danger' | 'warning' | 'success',
                          }))}
                        value={productId}
                        onChange={handleProductChange}
                        placeholder="-- Choose Product --"
                        required
                      />
                    </div>
                  )}

                  <div className="form-row" style={{ gap: '10px', marginBottom: '8px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Qty</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="1"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '0.75rem' }}>Retail Price (DZD)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="0"
                        required
                        value={priceDzd || ''}
                        onChange={(e) => setPriceDzd(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="form-section-divider" style={{ margin: '8px 0', fontSize: '0.75rem' }}>Sourcing Details (Optional)</div>

                  <div className="form-row" style={{ gap: '10px', marginBottom: '8px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Cost (€)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="0"
                        step="0.01"
                        value={originalCostEur || ''}
                        onChange={(e) => setOriginalCostEur(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Rate</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="1"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 250)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '0.75rem' }}>Delivery (DZD)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="0"
                        value={deliveryCostDzd || ''}
                        onChange={(e) => setDeliveryCostDzd(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '8px' }}>
                    <Plus size={14} /> Add Item to Pre-Order
                  </button>
                </form>
              </div>

              {/* Right Side: Pre-Order Cart & Customer Info */}
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--success)' }}>
                  Pre-Order Cart ({preOrderItems.length} items)
                </h4>

                {preOrderItems.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No products added yet. Add items on the left to build the pre-order.
                  </div>
                ) : (
                  <form onSubmit={handlePreOrderSubmit}>
                    {/* Cart Items List */}
                    <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Retail Price</th>
                            <th>Total Price</th>
                            <th style={{ width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {preOrderItems.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{item.productName}</td>
                              <td>{item.quantity}</td>
                              <td>{item.priceDzd.toLocaleString()} DZD</td>
                              <td style={{ fontWeight: 700 }}>{(item.quantity * item.priceDzd).toLocaleString()} DZD</td>
                              <td>
                                <button 
                                  type="button" 
                                  className="btn btn-danger btn-icon" 
                                  style={{ padding: '2px', color: 'var(--danger)', border: 'none', background: 'none' }}
                                  onClick={() => handleRemoveItemFromCart(idx)}
                                >
                                  <X size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Customer Selection */}
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Select Customer Profile</label>
                      <select 
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

                    <div className="form-row" style={{ gap: '10px', marginBottom: '8px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem' }}>Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          required
                          disabled={!!customerId}
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem' }}>Phone</label>
                        <input 
                          type="text" 
                          className="form-control"
                          disabled={!!customerId}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Address</label>
                      <input 
                        type="text" 
                        className="form-control"
                        disabled={!!customerId}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Notes</label>
                      <textarea 
                        className="form-control" 
                        rows={2}
                        placeholder="Pre-order notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      {editingPreOrder ? 'Save Changes' : 'Submit Pre-Order'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {isDownloadModalOpen && selectedPreOrder && (
        <div className="modal-backdrop">
          <div className="modal-container glass-card" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Download Excel Options</h2>
              <button className="modal-close" onClick={() => setIsDownloadModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Select the Excel format you want to download for <strong>{selectedPreOrder.customerName}</strong>:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Option 1 */}
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', gap: '12px' }}
                  onClick={downloadCustomerInvoice}
                >
                  <Download size={18} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>Option 1: Customer Invoice</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal', marginTop: '2px' }}>
                      Show product list and retail prices. Hide all sourcing and delivery costs.
                    </div>
                  </div>
                </button>

                {/* Option 2 */}
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', gap: '12px', border: '1px solid var(--border-color)' }}
                  onClick={downloadDeliverySheet}
                >
                  <Download size={18} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>Option 2: Delivery Sheet</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>
                      Show product list and delivery costs. Include total retail price to collect at the bottom.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setIsDownloadModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PreOrders;
