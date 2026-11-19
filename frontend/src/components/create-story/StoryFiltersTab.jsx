import React from 'react';
import { Film } from 'lucide-react';
import { INSTAGRAM_FILTERS } from '../../utils/instagramFilters';

export const StoryFiltersTab = ({
  isVideo,
  previewUrl,
  selectedFilter,
  setSelectedFilter,
}) => {
  return (
    <div className="ig-filters-gallery" style={{ padding: '14px' }}>
      {INSTAGRAM_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`ig-filter-card ${selectedFilter === f.id ? 'active' : ''}`}
          onClick={() => setSelectedFilter(f.id)}
        >
          <div className="ig-filter-thumb-box">
            {isVideo ? (
              <div
                className="ig-filter-thumb-video-fallback"
                style={{ filter: f.filter }}
              >
                <Film size={20} />
              </div>
            ) : (
              <img
                src={previewUrl}
                alt={f.name}
                className="ig-filter-thumb-img"
                style={{ filter: f.filter }}
              />
            )}
          </div>
          <span className="ig-filter-name-label">{f.name}</span>
        </button>
      ))}
    </div>
  );
};

export default StoryFiltersTab;
