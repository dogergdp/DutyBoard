<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('board');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('board');
    })->name('dashboard');

    Route::get('board', [BoardController::class, 'index'])->name('board');
    Route::patch('tasks/{task}/status', [BoardController::class, 'updateTaskStatus'])->name('tasks.update-status');

    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
});

require __DIR__.'/settings.php';
