<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    private const STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    private const PRIORITIES = ['LOW', 'MED', 'HIGH', 'URGENT'];

    public function index(Request $request)
    {
        $employeeId = $request->input('employee_id');
        $status = $request->input('status');
        $overdueOnly = $request->boolean('overdue_only');

        $tasks = Task::query()
            ->with('employee:id,full_name,photo_path,mobile')
            ->when($employeeId, fn ($query) => $query->where('assigned_to', $employeeId))
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($overdueOnly, fn ($query) => $query
                ->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->where('status', '!=', 'DONE'))
            ->orderByRaw('due_at IS NULL, due_at ASC')
            ->latest('id')
            ->get();

        $employees = Employee::query()->select(['id', 'full_name'])->orderBy('full_name')->get();

        $todayTasksCount = Task::where('status', 'DONE')
            ->whereDate('updated_at', \Carbon\Carbon::today())
            ->selectRaw('assigned_to, count(*) as count')
            ->groupBy('assigned_to')
            ->pluck('count', 'assigned_to');

        $hourTasksCount = Task::where('status', 'DONE')
            ->where('updated_at', '>=', now()->subHour())
            ->selectRaw('assigned_to, count(*) as count')
            ->groupBy('assigned_to')
            ->pluck('count', 'assigned_to');

        $achievements = [];
        foreach ($employees as $emp) {
            $id = $emp->id;
            $dayCount = $todayTasksCount[$id] ?? 0;
            $hourCount = $hourTasksCount[$id] ?? 0;
            
            if ($dayCount >= 10) $achievements[$id] = '👑 Legend Mode';
            elseif ($dayCount >= 5) $achievements[$id] = '💪 Machine Mode';
            elseif ($hourCount >= 3) $achievements[$id] = '🔥 On Fire';
        }

        return Inertia::render('admin/tasks/index', [
            'tasks' => $tasks,
            'employees' => $employees,
            'achievements' => $achievements,
            'statuses' => self::STATUSES,
            'priorities' => self::PRIORITIES,
            'filters' => [
                'employee_id' => $employeeId,
                'status' => $status,
                'overdue_only' => $overdueOnly,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:employees,id',
            'employee_id' => 'nullable|exists:employees,id',
            'status' => 'nullable|string|in:ASSIGNED,IN_PROGRESS,REVIEW,DONE',
            'priority' => 'nullable|string|in:LOW,MED,HIGH,URGENT',
            'due_at' => 'nullable|date',
            'deadline' => 'nullable|date',
        ]);

        $title = $validated['title'] ?? $validated['name'] ?? null;
        $assignedTo = $validated['assigned_to'] ?? $validated['employee_id'] ?? null;

        if (! $title || ! $assignedTo) {
            return back()->withErrors([
                'title' => $title ? null : 'The title field is required.',
                'assigned_to' => $assignedTo ? null : 'The assigned employee field is required.',
            ])->withInput();
        }

        Task::create([
            'title' => $title,
            'description' => $validated['description'] ?? '',
            'assigned_to' => $assignedTo,
            'status' => $validated['status'] ?? 'ASSIGNED',
            'priority' => $validated['priority'] ?? 'LOW',
            'due_at' => $validated['due_at'] ?? $validated['deadline'] ?? null,
        ]);

        return redirect()->route('admin.tasks.index');
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:LOW,MED,HIGH,URGENT',
            'due_at' => 'nullable|date',
            'assigned_to' => 'nullable|exists:employees,id',
        ]);

        $task->update([
            'title' => $validated['title'] ?? $task->title,
            'description' => $validated['description'] ?? $task->description,
            'priority' => $validated['priority'] ?? $task->priority,
            'due_at' => $validated['due_at'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? $task->assigned_to,
        ]);

        return redirect()->route('admin.tasks.index');
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return redirect()->route('admin.tasks.index');
    }
}
