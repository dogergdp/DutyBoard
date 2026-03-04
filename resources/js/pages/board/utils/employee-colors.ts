/**
 * Employee column color palette
 * Provides unique colors for each employee column based on employee ID
 */

const EMPLOYEE_COLOR_PALETTE = [
    { bg: 'bg-pink-400/20', border: 'border-pink-500', accent: 'bg-pink-300' },
    { bg: 'bg-lime-400/20', border: 'border-lime-500', accent: 'bg-lime-300' },
    { bg: 'bg-cyan-400/20', border: 'border-cyan-500', accent: 'bg-cyan-300' },
    { bg: 'bg-yellow-400/20', border: 'border-yellow-500', accent: 'bg-yellow-300' },
    { bg: 'bg-purple-400/20', border: 'border-purple-500', accent: 'bg-purple-300' },
    { bg: 'bg-orange-400/20', border: 'border-orange-500', accent: 'bg-orange-300' },
    { bg: 'bg-red-400/20', border: 'border-red-500', accent: 'bg-red-300' },
    { bg: 'bg-blue-400/20', border: 'border-blue-500', accent: 'bg-blue-300' },
];

export interface EmployeeColorConfig {
    bg: string;
    border: string;
    accent: string;
}

/**
 * Get a unique color config for an employee based on their ID
 * Cycles through the palette using modulo
 */
export const getEmployeeColor = (employeeId: number): EmployeeColorConfig => {
    return EMPLOYEE_COLOR_PALETTE[employeeId % EMPLOYEE_COLOR_PALETTE.length];
};
