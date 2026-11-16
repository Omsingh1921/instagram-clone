import adminConfigService from './adminConfig.service';

export const dynamicConfigService = {
  getAllConfigs: async () => {
    return await adminConfigService.getDynamicConfigs();
  },

  updateConfig: async (key, value) => {
    return await adminConfigService.updateDynamicConfig(key, value);
  },

  resetConfig: async (key) => {
    return await adminConfigService.resetDynamicConfig(key);
  },

  resetAllConfigs: async () => {
    return await adminConfigService.resetAllDynamicConfigs();
  },

  getPublicConfigs: async () => {
    return await adminConfigService.getPublicDynamicConfigs();
  },

  /**
   * Fetches public runtime configuration entries as a key-value dictionary.
   * Falls back safely to an empty object if unavailable.
   */
  getPublicConfigMap: async () => {
    try {
      const res = await adminConfigService.getPublicDynamicConfigs();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.reduce((acc, item) => {
        if (item?.key) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  },
};

export default dynamicConfigService;
