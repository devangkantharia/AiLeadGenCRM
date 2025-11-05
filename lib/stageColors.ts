// Location: /lib/stageColors.ts
// Centralized color configuration for deal stages across the entire application

export const STAGE_COLORS = {
  Discovery: {
    radixBadge: "blue" as const,
    hex: "#0088FE",
    rgb: "0, 136, 254",
  },
  Proposal: {
    radixBadge: "yellow" as const,
    hex: "#FFBB28",
    rgb: "255, 187, 40",
  },
  Negotiation: {
    radixBadge: "purple" as const,
    hex: "#8884d8",
    rgb: "136, 132, 216",
  },
  Won: {
    radixBadge: "green" as const,
    hex: "#00C49F",
    rgb: "0, 196, 159",
  },
  Lost: {
    radixBadge: "red" as const,
    hex: "#FF8042",
    rgb: "255, 128, 66",
  },
} as const;

// Array of hex colors for chart libraries (PieChart, etc.)
export const CHART_COLORS = [
  STAGE_COLORS.Discovery.hex,
  STAGE_COLORS.Proposal.hex,
  STAGE_COLORS.Negotiation.hex,
  STAGE_COLORS.Won.hex,
  STAGE_COLORS.Lost.hex,
];

// Helper function to get Radix UI badge color
export function getStatusBadgeColor(status: string): "blue" | "yellow" | "purple" | "green" | "red" | "gray" {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return STAGE_COLORS[normalizedStatus as keyof typeof STAGE_COLORS]?.radixBadge || "gray";
}

// Helper function to get hex color for a stage (with optional opacity)
export function getStageHexColor(stage: string, opacity: number = 0.9): string {
  const normalizedStage = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  const color = STAGE_COLORS[normalizedStage as keyof typeof STAGE_COLORS];

  if (!color) return opacity < 1 ? `rgba(156, 163, 175, ${opacity})` : "#9CA3AF";

  // If opacity is 1, return hex; otherwise return rgba
  if (opacity >= 1) {
    return color.hex;
  }

  return `rgba(${color.rgb}, ${opacity})`;
}

// Helper function to get RGBA color for badges (with optional opacity)
export function getStatusBadgeRgbaColor(status: string, opacity: number = 1): string {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const color = STAGE_COLORS[normalizedStatus as keyof typeof STAGE_COLORS];

  if (!color) return `rgba(156, 163, 175, ${opacity})`; // gray

  return `rgba(${color.rgb}, ${opacity})`;
}

// Helper function to get background color for lane (with customizable opacity)
export function getLaneBackgroundColor(stage: string, isDarkMode: boolean, opacity?: number): string {
  const normalizedStage = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  const color = STAGE_COLORS[normalizedStage as keyof typeof STAGE_COLORS];

  if (!color) return isDarkMode ? "rgba(17, 24, 39, 0.5)" : "rgba(243, 244, 246, 1)";

  // Allow custom opacity or use defaults
  const finalOpacity = opacity !== undefined ? opacity : (isDarkMode ? 0.15 : 0.1);
  return `rgba(${color.rgb}, ${finalOpacity})`;
}

// Helper function to get border color for lane (with customizable opacity)
export function getLaneBorderColor(stage: string, isDarkMode: boolean, opacity?: number): string {
  const normalizedStage = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  const color = STAGE_COLORS[normalizedStage as keyof typeof STAGE_COLORS];

  if (!color) return isDarkMode ? "rgba(55, 65, 81, 1)" : "rgba(229, 231, 235, 1)";

  // Allow custom opacity or use defaults
  const finalOpacity = opacity !== undefined ? opacity : 0.3;
  return `rgba(${color.rgb}, ${finalOpacity})`;
}