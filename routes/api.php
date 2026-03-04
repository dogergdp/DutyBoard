<?php

use App\Http\Controllers\BoardController;
use Illuminate\Support\Facades\Route;

Route::get('/board-data', [BoardController::class, 'boardData']);
