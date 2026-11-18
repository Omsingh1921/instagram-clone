import React from 'react';
import Modal from '../common/Modal';

export const CHAT_THEMES = [
  { id: 'DEFAULT', name: 'Default', colors: ['#a855f7', '#6366f1'] },
  { id: 'CYBERPUNK', name: 'Cyberpunk', colors: ['#00f0ff', '#ff003c'] },
  { id: 'LAVENDER', name: 'Lavender', colors: ['#c084fc', '#e879f9'] },
  { id: 'SUNSET', name: 'Sunset', colors: ['#f97316', '#ec4899'] },
  { id: 'OCEAN', name: 'Ocean', colors: ['#06b6d4', '#3b82f6'] },
  { id: 'NEON', name: 'Neon', colors: ['#10b981', '#a855f7'] },
  { id: 'MONOCHROME', name: 'Monochrome', colors: ['#94a3b8', '#64748b'] },
];

export const ThemePickerModal = ({ isOpen, onClose, currentTheme = 'DEFAULT', onSelectTheme }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chat Theme"
      size="sm"
    >
      <div className="chat-theme-picker-list">
        {CHAT_THEMES.map((th) => {
          const isSelected = (currentTheme || 'DEFAULT').toUpperCase() === th.id;
          return (
            <button
              key={th.id}
              type="button"
              className={`chat-theme-option-row ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectTheme(th.id)}
            >
              <div
                className="chat-theme-swatch"
                style={{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` }}
              />
              <span className="chat-theme-option-name">{th.name}</span>
              {isSelected && <span className="chat-theme-check-dot">✓</span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default ThemePickerModal;
