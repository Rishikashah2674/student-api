import React, { useState } from 'react';
import { Edit2, Trash2, UserX, Copy, Check, ShoppingBag, Package } from 'lucide-react';

export const StudentList = ({
  items = [],
  activeTab = 'users',
  loading,
  error,
  onEdit,
  onDelete,
  onRetry
}) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="card loading-container">
        <div className="spinner"></div>
        <p>Loading {activeTab}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <div className="alert alert-danger" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          {error}
        </div>
        <div>
          <button className="btn btn-secondary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="card empty-state">
        {activeTab === 'users' && <UserX size={48} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />}
        {activeTab === 'products' && <Package size={48} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />}
        {activeTab === 'orders' && <ShoppingBag size={48} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />}
        <h3>No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Found</h3>
        <p style={{ marginTop: '0.5rem' }}>
          {activeTab === 'users' && 'Add your first user record to User Service (Port 3001).'}
          {activeTab === 'products' && 'Add your first product to Product Service (Port 3002).'}
          {activeTab === 'orders' && 'Place your first order to trigger Order Service (Port 3003) inter-service communication.'}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-container">
        <table className="student-table">
          <thead>
            {activeTab === 'users' && (
              <tr>
                <th>ID</th>
                <th>User / Student Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            )}
            {activeTab === 'products' && (
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            )}
            {activeTab === 'orders' && (
              <tr>
                <th>Order ID</th>
                <th>User Details</th>
                <th>Product Details</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item) => {
              const itemId = item._id !== undefined ? item._id : item.id;
              const isCopied = copiedId === itemId;

              if (activeTab === 'users') {
                return (
                  <tr key={itemId}>
                    <td>
                      <div className="id-code-badge">
                        <span>{itemId}</span>
                        <button
                          className="btn-copy-id"
                          onClick={() => handleCopyId(itemId)}
                          title="Copy User ID"
                        >
                          {isCopied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="student-name">{item.name}</td>
                    <td className="student-email">{item.email}</td>
                    <td>
                      <span className="badge badge-course">{item.role || 'student'}</span>
                    </td>
                    <td>
                      <span className="badge badge-semester">{item.department || item.course || 'Computer Science'}</span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => onEdit(item)}
                          title="Edit User"
                        >
                          <Edit2 size={15} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => onDelete(item)}
                          title="Delete User"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (activeTab === 'products') {
                return (
                  <tr key={itemId}>
                    <td>
                      <div className="id-code-badge">
                        <span>{itemId}</span>
                        <button
                          className="btn-copy-id"
                          onClick={() => handleCopyId(itemId)}
                          title="Copy Product ID"
                        >
                          {isCopied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="student-name">{item.name}</td>
                    <td style={{ fontWeight: 600, color: '#34d399' }}>${item.price}</td>
                    <td>
                      <span className="badge badge-course">{item.category || 'General'}</span>
                    </td>
                    <td>
                      <span className="badge badge-semester">{item.stock ?? 100} in stock</span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => onEdit(item)}
                          title="Edit Product"
                        >
                          <Edit2 size={15} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => onDelete(item)}
                          title="Delete Product"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (activeTab === 'orders') {
                return (
                  <tr key={itemId}>
                    <td>
                      <div className="id-code-badge">
                        <span>{itemId}</span>
                        <button
                          className="btn-copy-id"
                          onClick={() => handleCopyId(itemId)}
                          title="Copy Order ID"
                        >
                          {isCopied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="student-name">{item.userSnapshot?.name || `User ID: ${item.userId}`}</div>
                      <div className="student-email">{item.userSnapshot?.email || `ID: ${item.userId}`}</div>
                    </td>
                    <td>
                      <div className="student-name">{item.productSnapshot?.name || `Product ID: ${item.productId}`}</div>
                      <div className="student-email">{item.productSnapshot?.category ? `${item.productSnapshot.category} ($${item.productSnapshot.price})` : `ID: ${item.productId}`}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ fontWeight: 600, color: '#34d399' }}>${item.totalPrice}</td>
                    <td>
                      <span className="badge badge-course">{item.status || 'CREATED'}</span>
                    </td>
                  </tr>
                );
              }

              return null;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
