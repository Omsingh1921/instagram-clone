import React, { useState } from 'react';
import Modal from '../common/Modal';
import collectionService from '../../services/collection.service';
import { useToast } from '../../context/ToastContext';
import './CreateCollectionModal.css';

export const CreateCollectionModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      await collectionService.createCollection({ name: name.trim() });
      showSuccess(`Collection "${name.trim()}" created`);
      setName('');
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      showError(err.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Collection">
      <form onSubmit={handleCreate} className="create-collection-form">
        <input
          type="text"
          className="input collection-name-input"
          placeholder="Collection name (e.g. Travel, Inspiration)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoFocus
        />
        <div className="collection-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCollectionModal;
