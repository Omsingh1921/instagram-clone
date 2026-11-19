import React from 'react';
import { Film } from 'lucide-react';
import { INSTAGRAM_FILTERS } from '../../utils/instagramFilters';

export const ReelFiltersGallery = ({
  selectedFilter,
  setSelectedFilter,
  customThumbnailUrl,
}) => {
  return (
    <div className="ig-filters-gallery">
      {INSTAGRAM_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`ig-filter-card ${selectedFilter === f.id ? 'active' : ''}`}
          onClick={() => setSelectedFilter(f.id)}
        >
          <div className="ig-filter-thumb-box">
            {customThumbnailUrl ? (
              <img
                src={customThumbnailUrl}
                alt={f.name}
                className="ig-filter-thumb-img"
                style={{ filter: f.filter }}
              />
            ) : (
              <div className="ig-filter-thumb-video-fallback" style={{ filter: f.filter }}>
                <Film size={20} />
              </div>
            )}
            <span className="ig-filter-video-badge" title="Reel filter">
              <Film size={10} />
            </span>
          </div>
          <span className="ig-filter-name">{f.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ReelFiltersGallery;
