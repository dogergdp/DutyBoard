<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BoardController extends Controller
{
    public function boardData(): JsonResponse
    {
        $employees = Employee::query()
            ->select(['id', 'full_name', 'photo_path'])
            ->orderBy('full_name')
            ->get();

        $tasks = Task::query()
            ->with('employee:id,full_name')
            ->orderBy('due_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'assigned_to' => $task->assigned_to,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_at' => $task->due_at?->format('Y-m-d H:i:s'),
                'created_at' => $task->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $task->updated_at?->format('Y-m-d H:i:s'),
                'full_name' => $task->employee?->full_name,
            ])
            ->values();

        return response()->json([
            'ok' => true,
            'employees' => $employees,
            'tasks' => $tasks,
        ]);
    }

    public function index()
    {
        $employees = Employee::with(['tasks' => function ($query) {
            $query->orderBy('due_at', 'asc');
        }])->get();

        return Inertia::render('board', [
            'employees' => $employees,
            'priorities' => ['LOW', 'MED', 'HIGH', 'URGENT']
        ]);
    }

    public function updateTaskStatus(Request $request, Task $task)
    {
        // Simple admin check - assuming 'admin' role or just allowing for this prototype
        // In a real app, use Gate::authorize or similar.

        $request->validate([
            'status' => 'required|string|in:ASSIGNED,IN_PROGRESS,REVIEW,BLOCKED,DONE',
        ]);

        $task->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Task status updated.');
    }
}
