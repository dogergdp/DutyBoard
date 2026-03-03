<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('board');
});

Route::get('board', [BoardController::class, 'index'])->name('board');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('board');
    })->name('dashboard');

    Route::get('admin/tasks', [TaskController::class, 'index'])->name('admin.tasks.index');
    Route::post('admin/tasks', [TaskController::class, 'store'])->name('admin.tasks.store');
    Route::patch('tasks/{task}/status', [BoardController::class, 'updateTaskStatus'])->name('tasks.update-status');

    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::patch('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
});

require __DIR__.'/settings.php';
