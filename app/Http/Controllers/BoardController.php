<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BoardController extends Controller
{
    public function index()
    {
        $employees = Employee::with(['tasks' => function ($query) {
            $query->orderBy('due_at', 'asc');
        }])->get();

        return Inertia::render('board', [
            'employees' => $employees,
            'statuses' => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE'],
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
