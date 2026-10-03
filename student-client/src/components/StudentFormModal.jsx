import React, { useState, useEffect } from 'react';
import { createUser, updateUser, createProduct, updateProduct, createOrder } from '../services/api';

export const StudentFormModal = ({ isOpen, onClose, itemToEdit, activeTab = 'users', onSuccess }) => {
  // User form state
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'student', department: 'Computer Science' });
  // Product form state
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'General', stock: '100' });
  // Order form state
  const [orderForm, setOrderForm] = useState({ userId: '', productId: '', quantity: '1' });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    if (activeTab === 'users') {
      if (itemToEdit) {
        setUserForm({
          name: itemToEdit.name || '',
          email: itemToEdit.email || '',
          role: itemToEdit.role || 'student',
          department: itemToEdit.department || itemToEdit.course || 'Computer Science'
        });
      } else {
        setUserForm({ name: '', email: '', role: 'student', department: 'Computer Science' });
      }
    } else if (activeTab === 'products') {
      if (itemToEdit) {
        setProductForm({
          name: itemToEdit.name || '',
          price: itemToEdit.price !== undefined ? String(itemToEdit.price) : '',
          category: itemToEdit.category || 'General',
          stock: itemToEdit.stock !== undefined ? String(itemToEdit.stock) : '100'
        });
      } else {
        setProductForm({ name: '', price: '', category: 'General', stock: '100' });
      }
    } else if (activeTab === 'orders') {
      setOrderForm({ userId: '', productId: '', quantity: '1' });
    }
  }, [itemToEdit, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (activeTab === 'users') {
        if (!userForm.name.trim()) throw 'Name is required.';
        if (!userForm.email.trim() || !userForm.email.includes('@')) throw 'Valid email is required.';

        const payload = {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role.trim() || 'student',
          department: userForm.department.trim() || 'Computer Science'
        };

        const targetId = itemToEdit?._id !== undefined ? itemToEdit._id : itemToEdit?.id;
        if (itemToEdit && targetId) {
          await updateUser(targetId, payload);
          onSuccess('User updated successfully!');
        } else {
          await createUser(payload);
          onSuccess('User created successfully in User Service (Port 3001)!');
        }
      } else if (activeTab === 'products') {
        if (!productForm.name.trim()) throw 'Product name is required.';
        const priceNum = Number(productForm.price);
        if (productForm.price === '' || isNaN(priceNum) || priceNum < 0) throw 'Valid non-negative price is required.';

        const payload = {
          name: productForm.name.trim(),
          price: priceNum,
          category: productForm.category.trim() || 'General',
          stock: productForm.stock ? Number(productForm.stock) : 100
        };

        const targetId = itemToEdit?._id !== undefined ? itemToEdit._id : itemToEdit?.id;
        if (itemToEdit && targetId) {
          await updateProduct(targetId, payload);
          onSuccess('Product updated successfully!');
        } else {
          await createProduct(payload);
          onSuccess('Product created successfully in Product Service (Port 3002)!');
        }
      } else if (activeTab === 'orders') {
        if (!orderForm.userId) throw 'User ID is required.';
        if (!orderForm.productId) throw 'Product ID is required.';
        const qty = Number(orderForm.quantity);
        if (isNaN(qty) || qty < 1) throw 'Quantity must be at least 1.';

        const payload = {
          userId: orderForm.userId,
          productId: orderForm.productId,
          quantity: qty
        };

        await createOrder(payload);
        onSuccess('Order created successfully via Order Service (Port 3003)!');
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    if (activeTab === 'users') return itemToEdit ? 'Edit User' : 'Add New User';
    if (activeTab === 'products') return itemToEdit ? 'Edit Product' : 'Add New Product';
    return 'Place New Order';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{getTitle()}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* USER FORM */}
          {activeTab === 'users' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Alice Smith"
                  value={userForm.name}
                  onChange={handleUserChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="e.g. alice@campus.edu"
                  value={userForm.email}
                  onChange={handleUserChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <input
                  id="role"
                  type="text"
                  name="role"
                  className="form-input"
                  placeholder="e.g. student"
                  value={userForm.role}
                  onChange={handleUserChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  className="form-input"
                  placeholder="e.g. Computer Science"
                  value={userForm.department}
                  onChange={handleUserChange}
                  disabled={submitting}
                />
              </div>
            </>
          )}

          {/* PRODUCT FORM */}
          {activeTab === 'products' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Campus Hoodie"
                  value={productForm.name}
                  onChange={handleProductChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  name="price"
                  className="form-input"
                  placeholder="e.g. 45.00"
                  value={productForm.price}
                  onChange={handleProductChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  name="category"
                  className="form-input"
                  placeholder="e.g. Apparel"
                  value={productForm.category}
                  onChange={handleProductChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock Quantity</label>
                <input
                  id="stock"
                  type="number"
                  name="stock"
                  className="form-input"
                  placeholder="e.g. 100"
                  value={productForm.stock}
                  onChange={handleProductChange}
                  disabled={submitting}
                />
              </div>
            </>
          )}

          {/* ORDER FORM */}
          {activeTab === 'orders' && (
            <>
              <div className="form-group">
                <label htmlFor="userId">User ID (Existing User in User Service)</label>
                <input
                  id="userId"
                  type="text"
                  name="userId"
                  className="form-input"
                  placeholder="e.g. 101"
                  value={orderForm.userId}
                  onChange={handleOrderChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productId">Product ID (Existing Product in Product Service)</label>
                <input
                  id="productId"
                  type="text"
                  name="productId"
                  className="form-input"
                  placeholder="e.g. 501"
                  value={orderForm.productId}
                  onChange={handleOrderChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  name="quantity"
                  className="form-input"
                  placeholder="e.g. 2"
                  value={orderForm.quantity}
                  onChange={handleOrderChange}
                  disabled={submitting}
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : itemToEdit ? 'Save Changes' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
