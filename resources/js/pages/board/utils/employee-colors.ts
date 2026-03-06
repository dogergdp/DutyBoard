/**
 * Employee column color palette
 * Provides unique colors for each employee column based on employee ID
 */

const EMPLOYEE_COLOR_PALETTE = [
    { bg: 'bg-rose-50/90', sideBorder: 'border-l-rose-300/80', sideDepth: 'bg-rose-300/45', accent: 'bg-rose-100/80' },
    { bg: 'bg-lime-50/90', sideBorder: 'border-l-lime-300/80', sideDepth: 'bg-lime-300/45', accent: 'bg-lime-100/80' },
    { bg: 'bg-cyan-50/90', sideBorder: 'border-l-cyan-300/80', sideDepth: 'bg-cyan-300/45', accent: 'bg-cyan-100/80' },
    { bg: 'bg-amber-50/90', sideBorder: 'border-l-amber-300/80', sideDepth: 'bg-amber-300/45', accent: 'bg-amber-100/80' },
    { bg: 'bg-violet-50/90', sideBorder: 'border-l-violet-300/80', sideDepth: 'bg-violet-300/45', accent: 'bg-violet-100/80' },
    { bg: 'bg-orange-50/90', sideBorder: 'border-l-orange-300/80', sideDepth: 'bg-orange-300/45', accent: 'bg-orange-100/80' },
    { bg: 'bg-red-50/90', sideBorder: 'border-l-red-300/80', sideDepth: 'bg-red-300/45', accent: 'bg-red-100/80' },
    { bg: 'bg-sky-50/90', sideBorder: 'border-l-sky-300/80', sideDepth: 'bg-sky-300/45', accent: 'bg-sky-100/80' },
];

export interface EmployeeColorConfig {
    bg: string;
    sideBorder: string;
    sideDepth: string;
    accent: string;
}

/**
 * Get a unique color config for an employee based on their ID
 * Cycles through the palette using modulo
 */
export const getEmployeeColor = (employeeId: number): EmployeeColorConfig => {
    return EMPLOYEE_COLOR_PALETTE[employeeId % EMPLOYEE_COLOR_PALETTE.length];
};
