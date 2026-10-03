import React, { useState } from 'react';
import { deleteUser, deleteProduct } from '../services/api';

export const ConfirmDeleteModal = ({ isOpen, onClose, item, activeTab = 'users', onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !item) return null;

  const targetId = item._id !== undefined ? item._id : item.id;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        await deleteUser(targetId);
        onSuccess('User deleted successfully!');
      } else if (activeTab === 'products') {
        await deleteProduct(targetId);
        onSuccess('Product deleted successfully!');
      }
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirm Delete</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <p style={{ marginBottom: '1.5rem', color: '#94a3b8' }}>
          Are you sure you want to delete {activeTab === 'users' ? 'user' : 'product'}{' '}
          <strong style={{ color: '#ffffff' }}>{item.name}</strong> (ID: {targetId})? This action cannot be undone.
        </p>

        <div className="form-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
