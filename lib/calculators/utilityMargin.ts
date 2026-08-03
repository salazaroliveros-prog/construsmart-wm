/**
 * Utility Margin Calculator
 * Calculates profit margin based on financial settings from Adjustments Module
 */

export interface UtilityMarginResult {
  margin: number;
  marginPercentage: number;
  targetMargin: number;
  variance: number;
  isOnTarget: boolean;
  directCost: number;
  indirectCost: number;
  contingencyCost: number;
  totalCost: number;
}

export interface FinancialSettings {
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
}

/**
 * Calculate utility margin based on budget and actual costs
 * Uses parameters from SettingsManager (Adjustments Module)
 */
export function calculateUtilityMargin(
  totalBudget: number,
  totalSpent: number,
  financialSettings: FinancialSettings
): UtilityMarginResult {
  // Calculate indirect costs based on settings
  const indirectCost = totalBudget * (financialSettings.indirectPercentage / 100);
  
  // Calculate contingency based on settings
  const contingencyCost = totalBudget * (financialSettings.contingencyPercentage / 100);
  
  // Target profit from settings
  const targetProfit = totalBudget * (financialSettings.profitPercentage / 100);
  
  // Total costs including indirects and contingency
  const totalCost = totalSpent + indirectCost + contingencyCost;
  
  // Actual margin
  const margin = totalBudget - totalCost;
  const marginPercentage = totalBudget > 0 ? (margin / totalBudget) * 100 : 0;
  
  // Variance from target
  const variance = marginPercentage - financialSettings.profitPercentage;
  
  // Check if on target (within ±5% tolerance)
  const isOnTarget = Math.abs(variance) <= 5;
  
  return {
    margin,
    marginPercentage,
    targetMargin: financialSettings.profitPercentage,
    variance,
    isOnTarget,
    directCost: totalSpent,
    indirectCost,
    contingencyCost,
    totalCost,
  };
}

/**
 * Calculate projected utility margin for a specific project
 */
export function calculateProjectUtilityMargin(
  projectBudget: number,
  projectSpent: number,
  financialSettings: FinancialSettings
): UtilityMarginResult {
  return calculateUtilityMargin(projectBudget, projectSpent, financialSettings);
}

/**
 * Calculate aggregate utility margin across multiple projects
 */
export function calculateAggregateUtilityMargin(
  projects: Array<{ budget: number; spent: number }>,
  financialSettings: FinancialSettings
): UtilityMarginResult {
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  
  return calculateUtilityMargin(totalBudget, totalSpent, financialSettings);
}
