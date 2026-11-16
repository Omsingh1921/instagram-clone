import React from 'react';
import { Image, Sparkles, Clapperboard, ChevronRight } from 'lucide-react';
import Modal from '../common/Modal';
import './CreateModal.css';

export const CreateModal = ({
  isOpen,
  onClose,
  onSelectPost,
  onSelectStory,
  onSelectReel,
}) => {
  const options = [
    {
      id: 'post',
      title: 'Post',
      badge: 'Feed',
      desc: 'Share photos or videos to your feed',
      icon: Image,
      cardClass: 'create-card-post',
      iconClass: 'post-icon',
      onSelect: onSelectPost,
    },
    {
      id: 'story',
      title: 'Story',
      badge: '24h',
      desc: 'Disappears from your profile in 24 hours',
      icon: Sparkles,
      cardClass: 'create-card-story',
      iconClass: 'story-icon',
      onSelect: onSelectStory,
    },
    {
      id: 'reel',
      title: 'Reel',
      badge: 'Video',
      desc: 'Short immersive video with sound',
      icon: Clapperboard,
      cardClass: 'create-card-reel',
      iconClass: 'reel-icon',
      onSelect: onSelectReel,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New"
      size="sm"
      className="create-launcher-modal"
    >
      <div className="create-launcher-body">
        <p className="create-launcher-subtitle">
          Choose a studio format to share with your followers
        </p>

        <div className="create-menu-options">
          {options.map((opt) => {
            const IconComp = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                className={`create-menu-item ${opt.cardClass}`}
                onClick={() => {
                  onClose();
                  opt.onSelect();
                }}
              >
                <div className={`create-item-icon-box ${opt.iconClass}`}>
                  <IconComp size={22} strokeWidth={2.1} />
                </div>

                <div className="create-item-info">
                  <div className="create-item-title-row">
                    <span className="create-item-title">{opt.title}</span>
                    <span className="create-item-pill">{opt.badge}</span>
                  </div>
                  <span className="create-item-desc">{opt.desc}</span>
                </div>

                <ChevronRight size={18} className="create-item-chevron" />
              </button>
            );
          })}
        </div>

        <div className="create-launcher-footer">
          Supports photos, multi-slide carousels, and cropped vertical videos
        </div>
      </div>
    </Modal>
  );
};

export default CreateModal;
