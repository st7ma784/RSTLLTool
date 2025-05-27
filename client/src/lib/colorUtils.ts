import type { MatrixCell } from "@shared/schema";

export interface ColorConfig {
  mode: string;
  intensity: number;
}

/**
 * Calculate color for a matrix cell based on the selected color mode
 */
export function calculateCellColor(
  cell: MatrixCell, 
  config: ColorConfig, 
  allCells: MatrixCell[]
): string {
  const { mode, intensity } = config;
  
  // Default type-based colors
  if (mode === 'type') {
    return getTypeColor(cell.type, intensity);
  }
  
  // Structure-based colors
  if (mode === 'structure') {
    return getStructureColor(cell, intensity);
  }
  
  // Value-based continuous colors
  return getValueBasedColor(cell, mode, intensity, allCells);
}

/**
 * Get color based on cell type (active, dropped, etc.)
 */
function getTypeColor(type: string, intensity: number): string {
  const alpha = intensity / 100;
  
  switch (type) {
    case 'active':
      return `rgba(16, 185, 129, ${alpha})`; // Green
    case 'dropped':
      return `rgba(239, 68, 68, ${alpha})`; // Red
    case 'pointer':
      return `rgba(59, 130, 246, ${alpha})`; // Blue
    case 'empty':
      return `rgba(107, 114, 128, ${alpha * 0.3})`; // Gray (dimmer)
    default:
      return `rgba(107, 114, 128, ${alpha})`;
  }
}

/**
 * Get color based on structure name
 */
function getStructureColor(cell: MatrixCell, intensity: number): string {
  const alpha = intensity / 100;
  
  if (!cell.structureName) {
    return `rgba(107, 114, 128, ${alpha})`;
  }
  
  // Generate consistent color based on structure name hash
  const hash = hashString(cell.structureName);
  const hue = hash % 360;
  
  return `hsla(${hue}, 70%, 60%, ${alpha})`;
}

/**
 * Get color based on numeric value with gradient
 */
function getValueBasedColor(
  cell: MatrixCell, 
  attribute: string, 
  intensity: number, 
  allCells: MatrixCell[]
): string {
  const value = extractValue(cell, attribute);
  
  if (value === null) {
    // No value found, use default gray
    return `rgba(107, 114, 128, ${intensity / 100 * 0.3})`;
  }
  
  // Calculate value range for normalization
  const range = calculateValueRange(allCells, attribute);
  if (range.max === range.min) {
    return `rgba(59, 130, 246, ${intensity / 100})`; // Single value, use blue
  }
  
  // Normalize value to 0-1 range
  const normalized = (value - range.min) / (range.max - range.min);
  
  // Generate color gradient: Blue (low) → Green → Yellow → Red (high)
  return getGradientColor(normalized, intensity / 100);
}

/**
 * Extract numeric value from cell for given attribute
 */
function extractValue(cell: MatrixCell, attribute: string): number | null {
  // Check cell.value object
  if (cell.value && typeof cell.value === 'object' && cell.value[attribute] !== undefined) {
    const val = parseFloat(cell.value[attribute]);
    return isNaN(val) ? null : val;
  }
  
  // Check tooltip for attribute values
  if (cell.tooltip) {
    const regex = new RegExp(`${attribute}:\\s*(-?\\d+\\.?\\d*)`, 'i');
    const match = cell.tooltip.match(regex);
    if (match) {
      const val = parseFloat(match[1]);
      return isNaN(val) ? null : val;
    }
  }
  
  // Special handling for common RST attributes
  switch (attribute) {
    case 'power':
      return extractPowerValue(cell);
    case 'velocity':
      return extractVelocityValue(cell);
    case 'quality':
      return extractQualityValue(cell);
    case 'range':
      return extractRangeValue(cell);
    default:
      return null;
  }
}

/**
 * Calculate min/max range for an attribute across all cells
 */
function calculateValueRange(cells: MatrixCell[], attribute: string): { min: number; max: number } {
  const values: number[] = [];
  
  cells.forEach(cell => {
    const value = extractValue(cell, attribute);
    if (value !== null) {
      values.push(value);
    }
  });
  
  if (values.length === 0) {
    return { min: 0, max: 1 };
  }
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Generate gradient color from normalized value (0-1)
 */
function getGradientColor(normalized: number, alpha: number): string {
  // Clamp to 0-1 range
  const t = Math.max(0, Math.min(1, normalized));
  
  // Define color stops: Blue → Cyan → Green → Yellow → Red
  if (t < 0.25) {
    // Blue to Cyan
    const local = t / 0.25;
    const r = Math.round(59 + (64 - 59) * local);
    const g = Math.round(130 + (224 - 130) * local);
    const b = Math.round(246 + (208 - 246) * local);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (t < 0.5) {
    // Cyan to Green
    const local = (t - 0.25) / 0.25;
    const r = Math.round(64 + (16 - 64) * local);
    const g = Math.round(224 + (185 - 224) * local);
    const b = Math.round(208 + (129 - 208) * local);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (t < 0.75) {
    // Green to Yellow
    const local = (t - 0.5) / 0.25;
    const r = Math.round(16 + (245 - 16) * local);
    const g = Math.round(185 + (158 - 185) * local);
    const b = Math.round(129 + (11 - 129) * local);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    // Yellow to Red
    const local = (t - 0.75) / 0.25;
    const r = Math.round(245 + (239 - 245) * local);
    const g = Math.round(158 + (68 - 158) * local);
    const b = Math.round(11 + (68 - 11) * local);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

/**
 * Simple string hash function for consistent color generation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Extract power value from cell (RST specific)
 */
function extractPowerValue(cell: MatrixCell): number | null {
  // Try direct value access
  if (cell.value && typeof cell.value === 'number') {
    return cell.value;
  }
  
  // Try parsing from cell identifier
  if (typeof cell.value === 'string') {
    const match = cell.value.match(/power[:\s]*(-?\d+\.?\d*)/i);
    if (match) return parseFloat(match[1]);
  }
  
  return null;
}

/**
 * Extract velocity value from cell (RST specific)
 */
function extractVelocityValue(cell: MatrixCell): number | null {
  if (cell.value && typeof cell.value === 'object' && 'velocity' in cell.value) {
    return parseFloat(cell.value.velocity);
  }
  return null;
}

/**
 * Extract quality value from cell (RST specific)
 */
function extractQualityValue(cell: MatrixCell): number | null {
  if (cell.value && typeof cell.value === 'object' && 'quality' in cell.value) {
    return parseFloat(cell.value.quality);
  }
  return null;
}

/**
 * Extract range value from cell (RST specific)
 */
function extractRangeValue(cell: MatrixCell): number | null {
  if (cell.value && typeof cell.value === 'object' && 'range' in cell.value) {
    return parseFloat(cell.value.range);
  }
  
  // Extract from position as fallback
  return cell.x * 15; // Assume 15km per range gate
}

/**
 * Get available color modes based on data
 */
export function getAvailableColorModes(cells: MatrixCell[]): string[] {
  const modes = ['type', 'structure'];
  const attributes = new Set<string>();
  
  cells.forEach(cell => {
    if (cell.value && typeof cell.value === 'object') {
      Object.keys(cell.value).forEach(key => {
        if (typeof cell.value[key] === 'number') {
          attributes.add(key);
        }
      });
    }
  });
  
  return [...modes, ...Array.from(attributes)];
}