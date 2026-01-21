import type { ThemeConfig } from 'antd';
import { brandColors, layout } from './tokens';

/**
 * Ant Design Theme Configuration
 * Centralized theme settings for ConfigProvider
 */
export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: brandColors.primary,
    borderRadius: 8,
  },
  components: {
    Layout: {
      headerBg: layout.headerBg,
      headerHeight: layout.headerHeight,
      headerPadding: layout.headerPadding,
    },
  },
};
