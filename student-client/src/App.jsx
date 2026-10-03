import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentList } from './components/StudentList';
import { StudentFormModal } from './components/StudentFormModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { getUsers, getProducts, getOrders } from './services/api';
import { Plus, RefreshCw, Users, Package, ShoppingBag } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'products' | 'orders'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchActiveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (activeTab === 'users') {
        data = await getUsers();
      } else if (activeTab === 'products') {
        data = await getProducts();
      } else if (activeTab === 'orders') {
        data = await getOrders();
      }
      setItems(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchActiveData();
  }, [fetchActiveData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const handleOperationSuccess = (message) => {
    showToast(message);
    fetchActiveData();
  };

  return (
    <div className="app-container">
      <Navbar />

      {/* Microservices Navigation Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> User Service (:3001)
        </button>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} /> Product Service (:3002)
        </button>
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} /> Order Service (:3003)
        </button>
      </div>

      {toastMessage && (
        <div className="alert alert-success" style={{ animation: 'modalFadeIn 0.3s ease' }}>
          ✓ {toastMessage}
        </div>
      )}

      <div className="action-bar">
        <div className="section-heading">
          {activeTab === 'users' && (
            <>
              <h2>User & Student Records</h2>
              <p>Managed via User Service REST API (<code>http://localhost:3001/users</code>)</p>
            </>
          )}
          {activeTab === 'products' && (
            <>
              <h2>Product Catalog</h2>
              <p>Managed via Product Service REST API (<code>http://localhost:3002/products</code>)</p>
            </>
          )}
          {activeTab === 'orders' && (
            <>
              <h2>Order Management</h2>
              <p>Managed via Order Service REST API (<code>http://localhost:3003/orders</code>)</p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchActiveData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />{' '}
            {activeTab === 'users' && 'Add User'}
            {activeTab === 'products' && 'Add Product'}
            {activeTab === 'orders' && 'Place Order'}
          </button>
        </div>
      </div>

      <StudentList
        items={items}
        activeTab={activeTab}
        loading={loading}
        error={error}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        onRetry={fetchActiveData}
      />

      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        itemToEdit={itemToEdit}
        activeTab={activeTab}
        onSuccess={handleOperationSuccess}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        item={itemToDelete}
        activeTab={activeTab}
        onSuccess={handleOperationSuccess}
      />
    </div>
  );
}

export default App;
