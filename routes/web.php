<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\EmployeeTaskController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TaskController;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::guard('employee')->check()) {
        return redirect()->route('employee.tasks.index');
    }

    if (Auth::guard('web')->check()) {
        return redirect()->route('employees.index');
    }

    return redirect()->route('employees.index');
});

Route::get('login', fn (Request $request) => Inertia::render('auth/login', [
    'canResetPassword' => false,
    'canRegister' => false,
    'status' => $request->session()->get('status'),
]));

Route::post('login', function (Request $request) {
    $request->validate([
        'phone' => ['required', 'string'],
        'password' => ['required', 'string'],
    ]);

    $phone = (string) $request->input('phone');
    $password = (string) $request->input('password');

    $employee = Employee::query()->where('mobile', $phone)->first();

    if (! $employee || ! Hash::check($password, (string) $employee->password)) {
        throw ValidationException::withMessages([
            'phone' => [trans('auth.failed')],
        ]);
    }

    Auth::guard('employee')->login($employee, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->route('employee.tasks.index');
})->middleware('throttle:login');

Route::post('logout', function (Request $request) {
    Auth::guard('web')->logout();
    Auth::guard('employee')->logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/admin/login');
});

Route::get('board', [BoardController::class, 'index'])->name('board');

Route::middleware(['auth:web', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('employees.index');
    })->name('dashboard');

    Route::get('admin/tasks', [TaskController::class, 'index'])->name('admin.tasks.index');
    Route::post('admin/tasks', [TaskController::class, 'store'])->name('admin.tasks.store');
    Route::patch('admin/tasks/{task}', [TaskController::class, 'update'])->name('admin.tasks.update');
    Route::delete('admin/tasks/{task}', [TaskController::class, 'destroy'])->name('admin.tasks.destroy');
    Route::patch('tasks/{task}/status', [BoardController::class, 'updateTaskStatus'])->name('tasks.update-status');

    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::patch('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
});

Route::middleware(['auth:employee'])->group(function () {
    Route::get('employee/tasks', [EmployeeTaskController::class, 'index'])->name('employee.tasks.index');
    Route::patch('employee/tasks/{task}/status', [EmployeeTaskController::class, 'updateStatus'])->name('employee.tasks.update-status');
});

require __DIR__.'/settings.php';
