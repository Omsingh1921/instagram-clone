/**
 * Instagram Filter Presets and Aspect Ratio Configurations
 */

export const INSTAGRAM_FILTERS = [
  { id: 'NORMAL', name: 'Normal', filter: 'none' },
  { id: 'CLARENDON', name: 'Clarendon', filter: 'contrast(1.2) saturate(1.25)' },
  { id: 'GINGHAM', name: 'Gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'MOON', name: 'Moon', filter: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'LARK', name: 'Lark', filter: 'contrast(0.9) brightness(1.1) saturate(1.1)' },
  { id: 'REYES', name: 'Reyes', filter: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { id: 'JUNO', name: 'Juno', filter: 'contrast(1.15) brightness(1.05) saturate(1.35) sepia(0.12)' },
  { id: 'SLUMBER', name: 'Slumber', filter: 'saturate(0.66) brightness(1.05) sepia(0.35)' },
  { id: 'CREMA', name: 'Crema', filter: 'contrast(1.05) brightness(1.05) saturate(0.9) sepia(0.2)' },
  { id: 'LUDWIG', name: 'Ludwig', filter: 'contrast(1.08) brightness(1.05) saturate(1.12)' },
  { id: 'ADEN', name: 'Aden', filter: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.18)' },
  { id: 'PERPETUA', name: 'Perpetua', filter: 'contrast(1.1) brightness(1.05) saturate(1.1)' },
];

export const ASPECT_RATIOS = [
  { id: 'ORIGINAL', label: 'Original', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', ratio: '4 / 5' },
  { id: '16:9', label: '16:9 (Landscape)', ratio: '16 / 9' },
  { id: 'CUSTOM', label: 'Custom (Free)', ratio: null },
];

export const getFilterStyle = (filterName) => {
  const match = INSTAGRAM_FILTERS.find(
    (f) => f.id === filterName || f.name.toUpperCase() === (filterName || '').toUpperCase()
  );
  return match ? { filter: match.filter } : { filter: 'none' };
};

export default {
  INSTAGRAM_FILTERS,
  ASPECT_RATIOS,
  getFilterStyle,
};
