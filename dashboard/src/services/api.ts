/**
 * VAYUJIV API Configuration
 * Supports relative routing for Vercel multi-service rewrites and configurable base URL
 */
export const API_BASE = (import.meta as any).env?.VITE_API_URL || '';
