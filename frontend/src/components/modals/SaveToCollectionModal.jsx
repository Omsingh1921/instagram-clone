import React, { useState, useEffect } from 'react';
import { Folder, Plus, Check, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import collectionService from '../../services/collection.service';
import { useToast } from '../../context/ToastContext';
import CreateCollectionModal from './CreateCollectionModal';
import './SaveToCollectionModal.css';

export const SaveToCollectionModal = ({
  isOpen,
  onClose,
  postId = null,
  reelId = null,
  onSaved = null,
}) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await collectionService.getCollections();
      const list = res?.data || res || [];
      setCollections(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load collections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const handleSelectCollection = async (coll) => {
    if (savingId) return;
    try {
      setSavingId(coll.id);
      await collectionService.addItem(coll.id, postId, reelId);
      showSuccess(`Saved to "${coll.name}"`);
      onClose();
      if (onSaved) onSaved(coll);
    } catch (err) {
      showError(err.message || 'Failed to add to collection');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Save to Collection" size="sm">
        <div className="save-to-coll-modal">
          {/* Top row: create new collection shortcut */}
          <button
            type="button"
            className="save-to-coll-create-row"
            onClick={() => setCreateModalOpen(true)}
          >
            <div className="save-to-coll-plus-icon">
              <Plus size={20} />
            </div>
            <span>New Collection</span>
          </button>

          {/* List of existing collections */}
          <div className="save-to-coll-list">
            {loading ? (
              <div className="save-to-coll-loading">
                <Loader2 size={24} className="spinner" />
                <span>Loading collections...</span>
              </div>
            ) : collections.length === 0 ? (
              <div className="save-to-coll-empty">
                <span>No collections yet. Click "New Collection" to create your first one.</span>
              </div>
            ) : (
              collections.map((coll) => (
                <div
                  key={coll.id}
                  className="save-to-coll-row"
                  onClick={() => handleSelectCollection(coll)}
                >
                  <div className="save-to-coll-cover-wrap">
                    {coll.coverMediaUrl ? (
                      <img src={coll.coverMediaUrl} alt={coll.name} className="save-to-coll-cover" />
                    ) : (
                      <div className="save-to-coll-placeholder">
                        <Folder size={18} />
                      </div>
                    )}
                  </div>
                  <div className="save-to-coll-info">
                    <span className="save-to-coll-name">{coll.name}</span>
                    <span className="save-to-coll-count">{coll.itemCount || 0} saved</span>
                  </div>
                  {savingId === coll.id && (
                    <Loader2 size={16} className="spinner" style={{ marginLeft: 'auto' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Embedded Create Collection Modal */}
      {createModalOpen && (
        <CreateCollectionModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={async (newColl) => {
            await loadCollections();
            if (newColl?.id && (postId || reelId)) {
              handleSelectCollection(newColl);
            }
          }}
        />
      )}
    </>
  );
};

export default SaveToCollectionModal;
