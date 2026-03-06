/**
 * Employee column color palette
 * Provides unique colors for each employee column based on employee ID
 */

const EMPLOYEE_COLOR_PALETTE = [
    { bg: 'bg-rose-200', sideBorder: 'border-l-rose-800/90', sideDepth: 'bg-rose-900/80', accent: 'border-rose-800/70', textAccent: 'text-rose-900' },
    { bg: 'bg-lime-200', sideBorder: 'border-l-lime-800/90', sideDepth: 'bg-lime-900/80', accent: 'border-lime-800/70', textAccent: 'text-lime-900' },
    { bg: 'bg-cyan-200', sideBorder: 'border-l-cyan-800/90', sideDepth: 'bg-cyan-900/80', accent: 'border-cyan-800/70', textAccent: 'text-cyan-900' },
    { bg: 'bg-amber-200', sideBorder: 'border-l-amber-800/90', sideDepth: 'bg-amber-900/80', accent: 'border-amber-800/70', textAccent: 'text-amber-900' },
    { bg: 'bg-violet-200', sideBorder: 'border-l-violet-800/90', sideDepth: 'bg-violet-900/80', accent: 'border-violet-800/70', textAccent: 'text-violet-900' },
    { bg: 'bg-orange-200', sideBorder: 'border-l-orange-800/90', sideDepth: 'bg-orange-900/80', accent: 'border-orange-800/70', textAccent: 'text-orange-900' },
    { bg: 'bg-red-200', sideBorder: 'border-l-red-800/90', sideDepth: 'bg-red-900/80', accent: 'border-red-800/70', textAccent: 'text-red-900' },
    { bg: 'bg-sky-200', sideBorder: 'border-l-sky-800/90', sideDepth: 'bg-sky-900/80', accent: 'border-sky-800/70', textAccent: 'text-sky-900' },
];

export interface EmployeeColorConfig {
    bg: string;
    sideBorder: string;
    sideDepth: string;
    accent: string;
    textAccent: string;
}

/**
 * Get a unique color config for an employee based on their ID
 * Cycles through the palette using modulo
 */
export const getEmployeeColor = (employeeId: number): EmployeeColorConfig => {
    return EMPLOYEE_COLOR_PALETTE[employeeId % EMPLOYEE_COLOR_PALETTE.length];
};
