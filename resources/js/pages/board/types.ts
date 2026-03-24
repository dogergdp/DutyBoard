export interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Employee {
    id: number;
    full_name: string;
    photo_path: string | null;
    tasks: Task[];
}

export interface BoardProps {
    employees: Employee[];
    priorities: string[];
    idleTimeout: number;
}

export interface ApiBoardEmployee {
    id: number;
    full_name: string;
    photo_path: string | null;
}

export interface ApiBoardTask {
    id: number;
    title: string;
    description: string;
    assigned_to: number;
    status: string;
    priority: string;
    due_at: string | null;
    created_at: string;
    updated_at: string;
    full_name: string;
}

export interface ApiBoardPayload {
    ok: boolean;
    employees: ApiBoardEmployee[];
    tasks: ApiBoardTask[];
}

export type TaskSnapshot = Record<
    number,
    {
        status: string;
        assigned_to: number;
        updated_at: string;
    }
>;