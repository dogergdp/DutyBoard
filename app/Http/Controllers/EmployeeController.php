<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with('tasks')->get()->map(function (Employee $employee) {
            $employee->photo_url = $employee->photo_path
                ? asset('storage/'.$employee->photo_path)
                : null;

            return $employee;
        });

        return Inertia::render('employees/index', [
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20|unique:employees,mobile',
            'photo' => 'nullable|image|max:2048',
        ]);

        $photoPath = $request->file('photo')?->store('employees', 'public');

        Employee::create([
            'full_name' => $validated['full_name'],
            'mobile' => $validated['mobile'],
            'photo_path' => $photoPath,
            'password' => Hash::make('password'),
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'mobile' => [
                'required',
                'string',
                'max:20',
                'unique:employees,mobile,' . $employee->id . ',id',
            ],
            'photo' => 'nullable|image|max:2048',
        ]);

        $photoPath = $employee->photo_path;

        if ($request->hasFile('photo')) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            $photoPath = $request->file('photo')?->store('employees', 'public');
        }

        $employee->update([
            'full_name' => $validated['full_name'],
            'mobile' => $validated['mobile'],
            'photo_path' => $photoPath,
        ]);

        return redirect()->back();
    }

    public function destroy(Employee $employee)
    {
        if ($employee->tasks()->exists()) {
            return back()->withErrors([
                'delete' => 'Cannot delete employee with assigned tasks.',
            ]);
        }

        if ($employee->photo_path) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $employee->delete();

        return redirect()->back();
    }
}
