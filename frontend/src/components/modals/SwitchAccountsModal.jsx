import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SwitchAccountsModal.css';

export const SwitchAccountsModal = ({ isOpen, onClose, accounts: propAccounts }) => {
  const { user, savedAccounts: authSavedAccounts, switchAccount, removeSavedAccount, logout } = useAuth();
  const savedAccounts = propAccounts || authSavedAccounts;
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [switchingId, setSwitchingId] = useState(null);

  // Filter accounts: ensure current user is at the top even if not in savedAccounts yet
  const accountsList = React.useMemo(() => {
    const list = [...(savedAccounts || [])];
    if (user && !list.some((a) => String(a.id) === String(user.id))) {
      list.unshift({
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.fullName || user.username,
        avatarUrl: user.avatarUrl || user.profilePictureUrl,
      });
    }
    return list;
  }, [savedAccounts, user]);

  const handleSwitch = async (targetId, username) => {
    if (String(targetId) === String(user?.id)) {
      onClose();
      return;
    }

    try {
      setSwitchingId(targetId);
      const success = await switchAccount(targetId);
      if (success) {
        showSuccess(`Switched to @${username}`);
        onClose();
      } else {
        showError(`Could not switch to @${username}. Session may have expired.`);
      }
    } catch {
      showError('Failed to switch accounts');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemove = (e, accountId, username) => {
    e.stopPropagation();
    removeSavedAccount(accountId);
    showSuccess(`Removed @${username} from saved accounts`);
  };

  const handleAddAccount = () => {
    onClose();
    navigate('/login');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Switch accounts" size="sm">
      <div className="switch-accounts-container">
        <div className="switch-accounts-list">
          {accountsList.map((account) => {
            const isActive = String(account.id) === String(user?.id);
            const isSwitching = switchingId === account.id;

            return (
              <div
                key={account.id}
                className={`switch-account-item ${isActive ? 'active-account' : ''}`}
                onClick={() => !isActive && !isSwitching && handleSwitch(account.id, account.username)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isActive && !isSwitching) {
                    handleSwitch(account.id, account.username);
                  }
                }}
              >
                <div className="switch-account-left">
                  <Avatar
                    src={account.avatarUrl}
                    username={account.username}
                    size="md"
                  />
                  <div className="switch-account-info">
                    <span className="switch-account-username">{account.username}</span>
                    <span className="switch-account-display-name">
                      {account.displayName || account.username}
                    </span>
                  </div>
                </div>

                <div className="switch-account-right">
                  {isSwitching ? (
                    <LoadingSpinner size="sm" />
                  ) : isActive ? (
                    <div className="active-account-badge" title="Active account">
                      <Check size={16} />
                    </div>
                  ) : (
                    <div className="switch-account-actions">
                      <button
                        type="button"
                        className="btn-switch-account"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitch(account.id, account.username);
                        }}
                      >
                        Switch
                      </button>
                      <button
                        type="button"
                        className="btn-remove-saved-account"
                        title="Remove from saved accounts"
                        onClick={(e) => handleRemove(e, account.id, account.username)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="switch-accounts-footer">
          <button
            type="button"
            className="btn-add-existing-account"
            onClick={handleAddAccount}
          >
            <Plus size={18} />
            <span>Log into an Existing Account</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SwitchAccountsModal;
