
export interface BudgetItem {
  id: number;
  name: string;
  limit: number;
  used: number;
}

const STORAGE_KEY = 'billmate_budgets';

export const getBudgets = (): BudgetItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) as BudgetItem[] : [];
  } catch {
    return [];
  }
};

export const saveBudgets = (budgets: BudgetItem[]): void => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(budgets)
  );
};
