<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkerPasswordSetupController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Worker Password Setup Web Routes (no auth required)
Route::get('/worker/setup-password/{token}', [WorkerPasswordSetupController::class, 'showSetupForm']);
Route::post('/worker/setup-password', [WorkerPasswordSetupController::class, 'setupPassword']);
