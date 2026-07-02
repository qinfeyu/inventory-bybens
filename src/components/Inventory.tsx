import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ArrowUpDown, 
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';

interface InventoryProps {
  category: 'Supplements' | 'Snacks';
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'landedCostDzd' | 'remainingStock' | 'createdAt' | 'updatedAt'>) => void;
  onAddProductsBulk: (products: Omit<Product, 'id' | 'landedCostDzd' | 'remainingStock' | 'createdAt' | 'updatedAt'>[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

type SortField = 'name' | 'sku' | 'brand' | 'remainingStock' | 'originalCostEur' | 'retailPriceDzd' | 'marginDzd';
type SortOrder = 'asc' | 'desc';

export const Inventory: React.FC<InventoryProps> = ({
  category,
  products,
  onAddProduct,
  onAddProductsBulk,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const isSnacks = category === 'Snacks';

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [stockFilter, setStockFilter] = useState<'All' | 'InStock' | 'LowStock' | 'OutOfStock'>('All');
  const [selectedBrand, setSelectedBrand] = useState('All');

  // Spreadsheet Mode Toggle
  const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);

  // Import CSV Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvPreviewItems, setCsvPreviewItems] = useState<any[]>([]);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState('');

  // Quick Add Row State
  const [quickAdd, setQuickAdd] = useState({
    sku: '',
    name: '',
    brand: '',
    variant: '',
    size: '',
    originalCostEur: '',
    exchangeRate: '250',
    deliveryCostDzd: '0',
    retailPriceDzd: '',
    quantityPurchased: '',
    prozisLink: '',
    weightAlloc: ''
  });

  // Modal State (for detailed edit fallback)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    description: '',
    variant: '',
    size: '',
    originalCostEur: 0,
    exchangeRate: 250,
    deliveryCostDzd: 0,
    retailPriceDzd: 0,
    quantityPurchased: 0,
    quantitySold: 0,
    prozisLink: '',
    weightAlloc: 0
  });

  // Generate SKU when category changes or when opening quick add
  useEffect(() => {
    const prefix = category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setQuickAdd(prev => ({
      ...prev,
      sku: `${prefix}-${randomNum}`
    }));
  }, [category, products.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Quick Add Handler
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.name || !quickAdd.sku) {
      alert('Product Name and SKU are required.');
      return;
    }

    onAddProduct({
      sku: quickAdd.sku,
      name: quickAdd.name,
      brand: quickAdd.brand.trim() || 'Generic',
      category,
      variant: quickAdd.variant || 'Default',
      size: quickAdd.size || 'N/A',
      originalCostEur: parseFloat(quickAdd.originalCostEur) || 0,
      exchangeRate: parseFloat(quickAdd.exchangeRate) || 250,
      deliveryCostDzd: parseFloat(quickAdd.deliveryCostDzd) || 0,
      retailPriceDzd: parseFloat(quickAdd.retailPriceDzd) || 0,
      quantityPurchased: parseInt(quickAdd.quantityPurchased) || 0,
      quantitySold: 0,
      description: '',
      prozisLink: category === 'Snacks' ? quickAdd.prozisLink : undefined,
      weightAlloc: category === 'Snacks' ? parseFloat(quickAdd.weightAlloc) || 0 : undefined
    });

    // Reset quick add form
    const prefix = category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setQuickAdd({
      sku: `${prefix}-${randomNum}`,
      name: '',
      brand: '',
      variant: '',
      size: '',
      originalCostEur: '',
      exchangeRate: '250',
      deliveryCostDzd: '0',
      retailPriceDzd: '',
      quantityPurchased: '',
      prozisLink: '',
      weightAlloc: ''
    });
  };

  // Inline Cell Update (Spreadsheet Mode)
  const handleInlineUpdate = (product: Product, field: keyof Product, value: any) => {
    let parsedValue = value;
    
    // Parse numbers appropriately
    if (['originalCostEur', 'exchangeRate', 'deliveryCostDzd', 'retailPriceDzd', 'weightAlloc'].includes(field)) {
      parsedValue = parseFloat(value) || 0;
    } else if (['quantityPurchased', 'quantitySold'].includes(field)) {
      parsedValue = parseInt(value) || 0;
    }

    const updatedProduct = {
      ...product,
      [field]: parsedValue
    };

    // Recalculate landed cost in DZD
    if (['originalCostEur', 'exchangeRate', 'deliveryCostDzd'].includes(field)) {
      updatedProduct.landedCostDzd = (updatedProduct.originalCostEur * updatedProduct.exchangeRate) + updatedProduct.deliveryCostDzd;
    }

    if (field === 'quantityPurchased' || field === 'quantitySold') {
      updatedProduct.remainingStock = updatedProduct.quantityPurchased - updatedProduct.quantitySold;
    }

    onUpdateProduct(updatedProduct);
  };

  // Open Edit Modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      brand: product.brand || 'Generic',
      description: product.description || '',
      variant: product.variant,
      size: product.size,
      originalCostEur: product.originalCostEur,
      exchangeRate: product.exchangeRate,
      deliveryCostDzd: product.deliveryCostDzd,
      retailPriceDzd: product.retailPriceDzd,
      quantityPurchased: product.quantityPurchased,
      quantitySold: product.quantitySold,
      prozisLink: product.prozisLink || '',
      weightAlloc: product.weightAlloc || 0
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    onUpdateProduct({
      ...editingProduct,
      ...formData,
      prozisLink: category === 'Snacks' ? formData.prozisLink : undefined,
      weightAlloc: category === 'Snacks' ? formData.weightAlloc : undefined
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    console.log('handleDelete clicked for ID:', id, 'Name:', name);
    try {
      if (window.confirm(`Are you sure you want to archive "${name}"? It will be hidden from the catalog but preserved in sales history.`)) {
        console.log('Confirmation accepted, calling onDeleteProduct for:', id);
        onDeleteProduct(id);
      } else {
        console.log('Confirmation cancelled.');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      alert('Delete error: ' + error);
    }
  };

  const exportToCSV = () => {
    const isSnacks = category === 'Snacks';
    let headers = 'SKU,Brand,Product Name,Variant,Size,Price in Euro (€),Exchange Rate,Delivery Cost (DZD),Landed Cost (DZD),Retail Price (DZD),Margin (DZD),Purchased,Sold,Remaining Stock';
    if (isSnacks) headers += ',Prozis Link,Weight Alloc (kg)';
    headers += '\n';

    const rows = products.map(p => {
      const marginDzd = p.retailPriceDzd - p.landedCostDzd;
      let row = `"${p.sku}","${p.brand || 'Generic'}","${p.name.replace(/"/g, '""')}","${p.variant}","${p.size}",${p.originalCostEur},${p.exchangeRate},${p.deliveryCostDzd},${p.landedCostDzd},${p.retailPriceDzd},${marginDzd},${p.quantityPurchased},${p.quantitySold},${p.remainingStock}`;
      if (isSnacks) row += `,"${p.prozisLink || ''}",${p.weightAlloc || 0}`;
      return row + '\n';
    });
    
    const blob = new Blob([headers + rows.join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `POTY_${category}_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (line: string, delimiter = ','): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvValidationError(null);
    setCsvPreviewItems([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvValidationError('Empty file or failed to read content.');
        return;
      }

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setCsvValidationError('CSV must have a header row and at least one product row.');
        return;
      }

      // Dynamically detect delimiter (comma vs semicolon)
      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ';' : ',';

      const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase().replace(/["']/g, '').trim());
      
      const colMap = {
        sku: headers.findIndex(h => h === 'sku' || h.includes('code')),
        brand: headers.findIndex(h => h === 'brand'),
        name: headers.findIndex(h => h === 'name' || h.includes('product name') || h === 'product'),
        variant: headers.findIndex(h => h === 'variant' || h.includes('flavor') || h.includes('spec')),
        size: headers.findIndex(h => h === 'size' || h.includes('weight')),
        originalCostEur: headers.findIndex(h => h === 'originalcosteur' || h.includes('price in euro') || h.includes('cost eur') || h.includes('price eur') || h === 'cost' || h === 'euro cost'),
        exchangeRate: headers.findIndex(h => h === 'exchangerate' || h.includes('rate') || h.includes('exchange')),
        deliveryCostDzd: headers.findIndex(h => h === 'deliverycostdzd' || h.includes('delivery') || h.includes('delivery cost')),
        retailPriceDzd: headers.findIndex(h => h === 'retailpricedzd' || h.includes('retail') || h.includes('sell price') || h === 'retail price'),
        quantityPurchased: headers.findIndex(h => h === 'quantitypurchased' || h.includes('quantity') || h === 'qty' || h === 'purchased'),
        quantitySold: headers.findIndex(h => h === 'quantitysold' || h.includes('sold')),
        prozisLink: headers.findIndex(h => h === 'prozislink' || h.includes('link') || h === 'prozis'),
        weightAlloc: headers.findIndex(h => h === 'weightalloc' || h.includes('weight alloc') || h === 'weight')
      };

      if (colMap.name === -1) {
        setCsvValidationError('Could not find "Product Name" or "Name" column in headers. Please check header names.');
        return;
      }

      const parsedItems = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter);
        if (cols.length === 0 || cols.join('').trim() === '') continue;

        const getValue = (idx: number, def = '') => {
          if (idx === -1 || idx >= cols.length) return def;
          return cols[idx].replace(/^["']|["']$/g, '').trim();
        };

        const getFloat = (idx: number, def = 0) => {
          const val = getValue(idx);
          if (!val) return def;
          // Convert comma decimals to dot decimals (e.g. "12,50" -> "12.50")
          const cleanVal = val.replace(/,/g, '.').replace(/[^0-9.-]/g, '');
          const parsed = parseFloat(cleanVal);
          return isNaN(parsed) ? def : parsed;
        };

        const getInt = (idx: number, def = 0) => {
          const val = getValue(idx);
          if (!val) return def;
          const parsed = parseInt(val.replace(/[^0-9-]/g, ''), 10);
          return isNaN(parsed) ? def : parsed;
        };

        const name = getValue(colMap.name);
        if (!name) continue;

        let sku = getValue(colMap.sku);
        if (!sku) {
          const prefix = category.substring(0, 3).toUpperCase();
          sku = `${prefix}-AUTO-${Math.floor(1000 + Math.random() * 9000)}-${i}`;
        }

        parsedItems.push({
          sku,
          brand: getValue(colMap.brand) || 'Generic',
          name,
          category,
          variant: getValue(colMap.variant) || 'Default',
          size: getValue(colMap.size) || 'N/A',
          originalCostEur: getFloat(colMap.originalCostEur, 0),
          exchangeRate: getFloat(colMap.exchangeRate, 250),
          deliveryCostDzd: getFloat(colMap.deliveryCostDzd, 0),
          retailPriceDzd: getFloat(colMap.retailPriceDzd, 0),
          quantityPurchased: getInt(colMap.quantityPurchased, 0),
          quantitySold: getInt(colMap.quantitySold, 0),
          prozisLink: category === 'Snacks' ? getValue(colMap.prozisLink) || undefined : undefined,
          weightAlloc: category === 'Snacks' ? getFloat(colMap.weightAlloc, 0) || undefined : undefined
        });
      }

      if (parsedItems.length === 0) {
        setCsvValidationError('No valid products could be parsed from the file.');
      } else {
        setCsvPreviewItems(parsedItems);
      }
    };
    reader.onerror = () => {
      setCsvValidationError('Error reading the selected CSV file.');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (csvPreviewItems.length === 0) return;
    onAddProductsBulk(csvPreviewItems);
    setIsImportModalOpen(false);
    setCsvPreviewItems([]);
    setCsvFileName('');
  };

  // Get unique brands for filtering
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.variant.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'InStock') {
      matchesStock = product.remainingStock > 3;
    } else if (stockFilter === 'LowStock') {
      matchesStock = product.remainingStock > 0 && product.remainingStock <= 3;
    } else if (stockFilter === 'OutOfStock') {
      matchesStock = product.remainingStock === 0;
    }

    const matchesBrand = selectedBrand === 'All' || product.brand === selectedBrand;

    return matchesSearch && matchesStock && matchesBrand;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal: any = a[sortField as keyof Product];
    let bVal: any = b[sortField as keyof Product];

    if (sortField === 'marginDzd') {
      aVal = a.retailPriceDzd - a.landedCostDzd;
      bVal = b.retailPriceDzd - b.landedCostDzd;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  return (
    <div className="fade-in-section">
      {/* Action Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={`Search ${category.toLowerCase()}...`} 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          {/* Brand Filter */}
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '8px 12px' }}
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="All">All Brands</option>
            {uniqueBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '8px 12px' }}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
          >
            <option value="All">All Stock Levels</option>
            <option value="InStock">In Stock (&gt;3)</option>
            <option value="LowStock">Low Stock (1-3)</option>
            <option value="OutOfStock">Out of Stock (0)</option>
          </select>

          {/* Spreadsheet Mode Toggle */}
          <button 
            className={`btn ${isSpreadsheetMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsSpreadsheetMode(!isSpreadsheetMode)}
            title="Toggle Excel-like editing"
          >
            <FileSpreadsheet size={18} />
            {isSpreadsheetMode ? 'Close Spreadsheet Mode' : 'Spreadsheet Mode'}
          </button>

          {/* Export */}
          <button 
            className="btn btn-secondary"
            onClick={exportToCSV}
            title="Export this sheet to CSV"
          >
            Export CSV
          </button>

          {/* Import */}
          <button 
            className="btn btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
            title="Import products from a CSV file"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="glass-card table-card">
        <div className="table-container">
          <table className="custom-table spreadsheet-table">
            <thead>
              <tr>
                <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => handleSort('sku')}>
                  SKU <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('brand')}>
                  Brand <ArrowUpDown size={12} />
                </th>
                <th style={{ minWidth: '180px', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Product Name <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '120px' }}>Variant / Spec</th>
                <th style={{ width: '80px' }}>Size</th>
                <th style={{ width: '90px', cursor: 'pointer' }} onClick={() => handleSort('originalCostEur')}>
                  Price (€) <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '80px' }}>Rate</th>
                <th style={{ width: '100px' }}>Delivery (DZD)</th>
                <th style={{ width: '120px' }}>Landed Cost (DZD)</th>
                <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('retailPriceDzd')}>
                  Retail (DZD) <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('marginDzd')}>
                  Margin (DZD) <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '90px', cursor: 'pointer' }} onClick={() => handleSort('remainingStock')}>
                  Stock <ArrowUpDown size={12} />
                </th>
                {isSnacks && (
                  <>
                    <th style={{ width: '120px' }}>Prozis Link</th>
                    <th style={{ width: '80px' }}>Weight (kg)</th>
                  </>
                )}
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={isSnacks ? 15 : 13} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No products found. Add your first product using the Quick Add row below.
                  </td>
                </tr>
              ) : (
                sortedProducts.map(product => {
                  const marginDzd = product.retailPriceDzd - product.landedCostDzd;
                  const marginPct = product.retailPriceDzd > 0 ? (marginDzd / product.retailPriceDzd) * 100 : 0;
                  const isOut = product.remainingStock === 0;
                  const isLow = product.remainingStock > 0 && product.remainingStock <= 3;

                  return (
                    <tr key={product.id} className={isOut ? 'row-out-of-stock' : isLow ? 'row-low-stock' : ''}>
                      {/* SKU */}
                      <td className="font-mono">{product.sku}</td>

                      {/* Brand */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="text" 
                            className="inline-input"
                            defaultValue={product.brand}
                            onBlur={(e) => handleInlineUpdate(product, 'brand', e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{product.brand}</span>
                        )}
                      </td>
                      
                      {/* Name */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="text" 
                            className="inline-input"
                            defaultValue={product.name}
                            onBlur={(e) => handleInlineUpdate(product, 'name', e.target.value)}
                          />
                        ) : (
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                        )}
                      </td>

                      {/* Variant */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="text" 
                            className="inline-input"
                            defaultValue={product.variant}
                            onBlur={(e) => handleInlineUpdate(product, 'variant', e.target.value)}
                          />
                        ) : (
                          <span className="text-secondary">{product.variant}</span>
                        )}
                      </td>

                      {/* Size */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="text" 
                            className="inline-input"
                            style={{ textAlign: 'center' }}
                            defaultValue={product.size}
                            onBlur={(e) => handleInlineUpdate(product, 'size', e.target.value)}
                          />
                        ) : (
                          <span className="badge badge-secondary">{product.size}</span>
                        )}
                      </td>

                      {/* Price in Euro (€) */}
                      <td>
                        {isSpreadsheetMode ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '2px', color: 'var(--text-muted)' }}>€</span>
                            <input 
                              type="number" 
                              className="inline-input"
                              style={{ width: '60px' }}
                              step="0.01"
                              defaultValue={product.originalCostEur}
                              onBlur={(e) => handleInlineUpdate(product, 'originalCostEur', e.target.value)}
                            />
                          </div>
                        ) : (
                          <span>{product.originalCostEur.toFixed(2)} €</span>
                        )}
                      </td>

                      {/* Rate */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="number" 
                            className="inline-input"
                            style={{ width: '50px' }}
                            defaultValue={product.exchangeRate}
                            onBlur={(e) => handleInlineUpdate(product, 'exchangeRate', e.target.value)}
                          />
                        ) : (
                          <span>{product.exchangeRate}</span>
                        )}
                      </td>

                      {/* Delivery (DZD) */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="number" 
                            className="inline-input"
                            style={{ width: '60px' }}
                            defaultValue={product.deliveryCostDzd}
                            onBlur={(e) => handleInlineUpdate(product, 'deliveryCostDzd', e.target.value)}
                          />
                        ) : (
                          <span>{product.deliveryCostDzd.toLocaleString()} DZD</span>
                        )}
                      </td>

                      {/* Landed Cost DZD */}
                      <td className="font-mono text-secondary" style={{ fontWeight: 600 }}>
                        {product.landedCostDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD
                      </td>

                      {/* Retail Price DZD */}
                      <td>
                        {isSpreadsheetMode ? (
                          <input 
                            type="number" 
                            className="inline-input"
                            style={{ textAlign: 'right', fontWeight: 'bold' }}
                            defaultValue={product.retailPriceDzd}
                            onBlur={(e) => handleInlineUpdate(product, 'retailPriceDzd', e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: 700 }}>{product.retailPriceDzd.toLocaleString()} DZD</span>
                        )}
                      </td>

                      {/* Margin DZD */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className={marginDzd >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                            {marginDzd >= 0 ? '+' : ''}{marginDzd.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {marginPct.toFixed(0)}% margin
                          </span>
                        </div>
                      </td>

                      {/* Stock Info */}
                      <td>
                        {isSpreadsheetMode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                              <span style={{ width: '25px', color: 'var(--text-muted)' }}>Buy:</span>
                              <input 
                                type="number" 
                                className="inline-input"
                                style={{ width: '45px', padding: '1px 3px' }}
                                defaultValue={product.quantityPurchased}
                                onBlur={(e) => handleInlineUpdate(product, 'quantityPurchased', e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                              <span style={{ width: '25px', color: 'var(--text-muted)' }}>Sold:</span>
                              <input 
                                type="number" 
                                className="inline-input"
                                style={{ width: '45px', padding: '1px 3px' }}
                                defaultValue={product.quantitySold}
                                onBlur={(e) => handleInlineUpdate(product, 'quantitySold', e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{product.remainingStock}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {product.quantitySold} sold / {product.quantityPurchased}
                            </span>
                            {isOut && <span className="badge badge-danger" style={{ fontSize: '0.6rem', marginTop: '2px', padding: '2px 4px' }}>Out</span>}
                            {isLow && <span className="badge badge-warning" style={{ fontSize: '0.6rem', marginTop: '2px', padding: '2px 4px' }}>Low</span>}
                          </div>
                        )}
                      </td>

                      {/* Snacks Specific Columns */}
                      {isSnacks && (
                        <>
                          <td>
                            {isSpreadsheetMode ? (
                              <input 
                                type="text" 
                                className="inline-input"
                                defaultValue={product.prozisLink || ''}
                                onBlur={(e) => handleInlineUpdate(product, 'prozisLink', e.target.value)}
                              />
                            ) : (
                              product.prozisLink ? (
                                <a href={product.prozisLink} target="_blank" rel="noopener noreferrer" className="prozis-link-badge">
                                  Prozis <ExternalLink size={10} />
                                </a>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            {isSpreadsheetMode ? (
                              <input 
                                type="number" 
                                className="inline-input"
                                style={{ width: '50px' }}
                                step="0.01"
                                defaultValue={product.weightAlloc || 0}
                                onBlur={(e) => handleInlineUpdate(product, 'weightAlloc', e.target.value)}
                              />
                            ) : (
                              <span>{product.weightAlloc ? `${product.weightAlloc} kg` : '—'}</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-icon" 
                            title="Edit details"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon" 
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Archive product"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Quick Add Row (Excel style) */}
              <tr className="quick-add-row">
                <td>
                  <input 
                    type="text" 
                    className="quick-input font-mono" 
                    placeholder="SKU"
                    value={quickAdd.sku}
                    onChange={(e) => setQuickAdd({...quickAdd, sku: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    className="quick-input" 
                    placeholder="Brand"
                    value={quickAdd.brand}
                    onChange={(e) => setQuickAdd({...quickAdd, brand: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    className="quick-input" 
                    placeholder="+ New Item Name"
                    required
                    value={quickAdd.name}
                    onChange={(e) => setQuickAdd({...quickAdd, name: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    className="quick-input" 
                    placeholder="Variant/Flavor"
                    value={quickAdd.variant}
                    onChange={(e) => setQuickAdd({...quickAdd, variant: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    className="quick-input" 
                    placeholder="Size"
                    style={{ textAlign: 'center' }}
                    value={quickAdd.size}
                    onChange={(e) => setQuickAdd({...quickAdd, size: e.target.value})}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '2px' }}>€</span>
                    <input 
                      type="number" 
                      className="quick-input" 
                      placeholder="0.00"
                      value={quickAdd.originalCostEur}
                      onChange={(e) => setQuickAdd({...quickAdd, originalCostEur: e.target.value})}
                    />
                  </div>
                </td>
                <td>
                  <input 
                    type="number" 
                    className="quick-input" 
                    placeholder="Rate"
                    value={quickAdd.exchangeRate}
                    onChange={(e) => setQuickAdd({...quickAdd, exchangeRate: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    className="quick-input" 
                    placeholder="DZD"
                    value={quickAdd.deliveryCostDzd}
                    onChange={(e) => setQuickAdd({...quickAdd, deliveryCostDzd: e.target.value})}
                  />
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {((parseFloat(quickAdd.originalCostEur) || 0) * (parseFloat(quickAdd.exchangeRate) || 250) + (parseFloat(quickAdd.deliveryCostDzd) || 0)).toFixed(0)} DZD
                </td>
                <td>
                  <input 
                    type="number" 
                    className="quick-input" 
                    placeholder="Retail"
                    value={quickAdd.retailPriceDzd}
                    onChange={(e) => setQuickAdd({...quickAdd, retailPriceDzd: e.target.value})}
                  />
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {((parseFloat(quickAdd.retailPriceDzd) || 0) - ((parseFloat(quickAdd.originalCostEur) || 0) * (parseFloat(quickAdd.exchangeRate) || 250) + (parseFloat(quickAdd.deliveryCostDzd) || 0))).toFixed(0)} DZD
                </td>
                <td>
                  <input 
                    type="number" 
                    className="quick-input" 
                    placeholder="Qty"
                    value={quickAdd.quantityPurchased}
                    onChange={(e) => setQuickAdd({...quickAdd, quantityPurchased: e.target.value})}
                  />
                </td>
                {isSnacks && (
                  <>
                    <td>
                      <input 
                        type="text" 
                        className="quick-input" 
                        placeholder="Prozis Link"
                        value={quickAdd.prozisLink}
                        onChange={(e) => setQuickAdd({...quickAdd, prozisLink: e.target.value})}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="quick-input" 
                        placeholder="kg"
                        step="0.01"
                        value={quickAdd.weightAlloc}
                        onChange={(e) => setQuickAdd({...quickAdd, weightAlloc: e.target.value})}
                      />
                    </td>
                  </>
                )}
                <td>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={handleQuickAddSubmit}
                  >
                    <Plus size={14} /> Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (Fallback for detailed edits) */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container glass-card">
            <div className="modal-header">
              <h2>Edit Product Details</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sku">SKU Code</label>
                  <input 
                    type="text" 
                    id="sku" 
                    className="form-control"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input 
                    type="text" 
                    id="brand" 
                    className="form-control"
                    required
                    placeholder="e.g. Prozis, Optimum Nutrition"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="variant">Variant / Specification</label>
                  <input 
                    type="text" 
                    id="variant" 
                    className="form-control"
                    placeholder="e.g. Double Chocolate, Peanut Butter"
                    value={formData.variant}
                    onChange={(e) => setFormData({...formData, variant: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="size">Size / Weight</label>
                  <input 
                    type="text" 
                    id="size" 
                    className="form-control"
                    placeholder="e.g. 2.27kg, 1kg Bag"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="originalCostEur">Price in Euro (€)</label>
                  <input 
                    type="number" 
                    id="originalCostEur" 
                    className="form-control"
                    min="0"
                    step="0.01"
                    required
                    value={formData.originalCostEur}
                    onChange={(e) => setFormData({...formData, originalCostEur: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="exchangeRate">Exchange Rate (EUR to DZD)</label>
                  <input 
                    type="number" 
                    id="exchangeRate" 
                    className="form-control"
                    min="1"
                    required
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({...formData, exchangeRate: parseFloat(e.target.value) || 250})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deliveryCostDzd">Delivery Cost (DZD)</label>
                  <input 
                    type="number" 
                    id="deliveryCostDzd" 
                    className="form-control"
                    min="0"
                    required
                    value={formData.deliveryCostDzd}
                    onChange={(e) => setFormData({...formData, deliveryCostDzd: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>Calculated Landed Cost</label>
                  <div className="form-control-static font-mono" style={{ fontWeight: 700 }}>
                    {((formData.originalCostEur * formData.exchangeRate) + formData.deliveryCostDzd).toLocaleString()} DZD 
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="retailPriceDzd">Retail Price (DZD)</label>
                  <input 
                    type="number" 
                    id="retailPriceDzd" 
                    className="form-control"
                    min="0"
                    required
                    value={formData.retailPriceDzd}
                    onChange={(e) => setFormData({...formData, retailPriceDzd: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="quantityPurchased">Quantity Purchased</label>
                  <input 
                    type="number" 
                    id="quantityPurchased" 
                    className="form-control"
                    min="0"
                    required
                    value={formData.quantityPurchased}
                    onChange={(e) => setFormData({...formData, quantityPurchased: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="quantitySold">Quantity Sold</label>
                <input 
                  type="number" 
                  id="quantitySold" 
                  className="form-control"
                  min="0"
                  required
                  value={formData.quantitySold}
                  onChange={(e) => setFormData({...formData, quantitySold: parseInt(e.target.value) || 0})}
                />
              </div>

              {isSnacks && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prozisLink">Prozis Product Link</label>
                    <input 
                      type="text" 
                      id="prozisLink" 
                      className="form-control"
                      value={formData.prozisLink}
                      onChange={(e) => setFormData({...formData, prozisLink: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="weightAlloc">Weight Allocation (kg)</label>
                    <input 
                      type="number" 
                      id="weightAlloc" 
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={formData.weightAlloc}
                      onChange={(e) => setFormData({...formData, weightAlloc: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Product Description</label>
                <textarea 
                  id="description" 
                  className="form-control"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container glass-card" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Import {category} from CSV</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvPreviewItems([]);
                  setCsvValidationError(null);
                  setCsvFileName('');
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '10px 0' }}>
              {/* Instructions */}
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.15)', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '8px', fontWeight: 600 }}>CSV Header Mapping Instructions</h4>
                <p style={{ marginBottom: '8px' }}>
                  Upload a <strong>.csv</strong> file. The system will automatically detect the columns based on the headers in the first row. Column names are flexible!
                </p>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <li><strong>Product Name</strong> (Mandatory)</li>
                  <li><strong>SKU Code</strong> (Auto-generated if missing)</li>
                  <li><strong>Brand</strong> (Defaults to 'Generic')</li>
                  <li><strong>Variant / Spec</strong> (Flavor, color, etc.)</li>
                  <li><strong>Size</strong> (Defaults to 'N/A')</li>
                  <li><strong>Price in Euro (€)</strong> (Defaults to 0)</li>
                  <li><strong>Exchange Rate</strong> (Defaults to 250)</li>
                  <li><strong>Delivery Cost (DZD)</strong> (Defaults to 0)</li>
                  <li><strong>Retail Price (DZD)</strong> (Defaults to 0)</li>
                  <li><strong>Quantity Purchased</strong> (Defaults to 0)</li>
                  {isSnacks && (
                    <>
                      <li><strong>Prozis Link</strong> (Optional)</li>
                      <li><strong>Weight Alloc (kg)</strong> (Optional)</li>
                    </>
                  )}
                </ul>
              </div>

              {/* File Upload Zone */}
              <div style={{ 
                border: '2px dashed var(--border-color)', 
                borderRadius: '8px', 
                padding: '30px 20px', 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                marginBottom: '20px',
                position: 'relative'
              }}>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCsvFileSelected}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                  }}
                />
                <FileSpreadsheet size={48} style={{ color: 'var(--text-secondary)', marginBottom: '12px', opacity: 0.6 }} />
                {csvFileName ? (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{csvFileName}</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Click or drag to replace this file</p>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontWeight: 600 }}>Click to choose a CSV file</span> or drag & drop it here
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports standard spreadsheet exports</p>
                  </div>
                )}
              </div>

              {/* Error Handling */}
              {csvValidationError && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  borderRadius: '6px', 
                  padding: '12px', 
                  color: 'var(--danger)', 
                  fontSize: '0.85rem',
                  marginBottom: '20px'
                }}>
                  ⚠️ {csvValidationError}
                </div>
              )}

              {/* Preview Table */}
              {csvPreviewItems.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                    Parsed Preview ({csvPreviewItems.length} products found)
                  </h4>
                  <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '20px' }}>
                    <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Brand</th>
                          <th>Product Name</th>
                          <th>Variant</th>
                          <th>Size</th>
                          <th>Cost (€)</th>
                          <th>Retail (DZD)</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreviewItems.slice(0, 10).map((item, idx) => (
                          <tr key={idx}>
                            <td className="font-mono">{item.sku}</td>
                            <td>{item.brand}</td>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>{item.variant}</td>
                            <td>{item.size}</td>
                            <td>{item.originalCostEur.toFixed(2)} €</td>
                            <td>{item.retailPriceDzd.toLocaleString()} DZD</td>
                            <td>{item.quantityPurchased}</td>
                          </tr>
                        ))}
                        {csvPreviewItems.length > 10 && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              ... and {csvPreviewItems.length - 10} more items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvPreviewItems([]);
                  setCsvValidationError(null);
                  setCsvFileName('');
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={csvPreviewItems.length === 0}
                onClick={handleConfirmImport}
              >
                Import {csvPreviewItems.length} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
