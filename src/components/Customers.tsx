import React, { useState } from 'react';
import { Customer } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Phone, 
  MapPin, 
  Edit2,
  X
} from 'lucide-react';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}) => {
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [notes, setNotes] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Customer Name is required.');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer({
        id: editingCustomer.id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        instagram: instagram.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      onAddCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        instagram: instagram.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    // Reset Form
    setName('');
    setPhone('');
    setAddress('');
    setInstagram('');
    setNotes('');
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setAddress(cust.address || '');
    setInstagram(cust.instagram || '');
    setNotes(cust.notes || '');
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setInstagram('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      onDeleteCustomer(id);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.instagram && c.instagram.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fade-in-section">
      {/* Action Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Customers List */}
      <div className="glass-card">
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No customers found. Click "Add Customer" to create one.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Instagram</th>
                  <th>Notes</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                          {cust.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <div style={{ fontWeight: 600 }}>{cust.name}</div>
                      </div>
                    </td>
                    <td>
                      {cust.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="var(--text-muted)" /> {cust.phone}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {cust.address ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cust.address}>
                          <MapPin size={12} color="var(--text-muted)" /> {cust.address}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {cust.instagram ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                          <InstagramIcon /> {cust.instagram}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cust.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          title="Edit Customer"
                          onClick={() => openEditModal(cust)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          className="btn btn-danger btn-icon" 
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          title="Delete Customer"
                          onClick={() => handleDelete(cust.id, cust.name)}
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

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container glass-card">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="cust-name">Full Name</label>
                <input 
                  type="text" 
                  id="cust-name" 
                  className="form-control"
                  required
                  placeholder="e.g. Yacine Belkacem"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cust-phone">Phone Number</label>
                  <input 
                    type="text" 
                    id="cust-phone" 
                    className="form-control"
                    placeholder="e.g. 0550123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cust-instagram">Instagram Username</label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input 
                      type="text" 
                      id="cust-instagram" 
                      className="form-control"
                      placeholder="e.g. @yacine_fit"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cust-address">Delivery Address</label>
                <input 
                  type="text" 
                  id="cust-address" 
                  className="form-control"
                  placeholder="e.g. 12 Rue Didouche Mourad, Alger"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cust-notes">Notes / Customer Preferences</label>
                <textarea 
                  id="cust-notes" 
                  className="form-control"
                  rows={3}
                  placeholder="Preferences, size charts, or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
