<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeTaskController extends Controller
{
    public function index(Request $request)
    {
        $employee = $request->user('employee');

        $tasks = Task::query()
            ->where('assigned_to', $employee->id)
            ->orderByRaw('due_at IS NULL, due_at ASC')
            ->latest('id')
            ->get(['id', 'title', 'description', 'status', 'priority', 'due_at', 'assigned_to']);

        return Inertia::render('employee/tasks/index', [
            'employee' => [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'mobile' => $employee->mobile,
                'photo_url' => $employee->photo_url,
            ],
            'tasks' => $tasks,
        ]);
    }

    public function updateStatus(Request $request, Task $task)
    {
        $employee = $request->user('employee');

        if ((int) $task->assigned_to !== (int) $employee->id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['IN_PROGRESS', 'REVIEW'])],
        ]);

        $task->update([
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Task updated.');
    }
}
