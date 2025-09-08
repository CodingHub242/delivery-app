<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkerAuthController;

Route::prefix('worker')->group(function () {
    Route::post('/login', [WorkerAuthController::class, 'login']);
    Route::post('/register', [WorkerAuthController::class, 'register']);
});
