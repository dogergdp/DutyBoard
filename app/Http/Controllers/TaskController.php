<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:employees,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'due_at' => 'required|date',
            'status' => 'nullable|string',
            'priority' => 'nullable|string',
        ]);

        Task::create($validated);

        return redirect()->back();
    }
}
