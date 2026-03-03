<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        return Inertia::render('employees/index', [
            'employees' => Employee::with('tasks')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'photo_path' => 'nullable|string|max:255',
        ]);

        Employee::create($validated);

        return redirect()->back();
    }
}
