/**
 * Custom Design Tokens
 * Extends Ant Design's token system with app-specific values
 */

// ─── Brand Colors ───
export const brandColors = {
  primary: '#667eea',
  secondary: '#764ba2',
} as const;

// ─── Gradients ───
export const gradients = {
  primary: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
} as const;

// ─── Layout ───
export const layout = {
  headerHeight: 64,
  headerPadding: '0 24px',
  headerBg: 'rgba(255, 255, 255, 0.95)',
} as const;
