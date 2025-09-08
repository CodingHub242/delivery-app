n the<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\WorkerController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\OrderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

use App\Http\Controllers\Api\ServiceRequestController;

// Worker Password Setup Routes (no auth middleware)
Route::post('/worker/setup-password/{token}', [\App\Http\Controllers\Api\WorkerPasswordSetupController::class, 'showSetupForm']);
Route::post('/workers/setup-password', [\App\Http\Controllers\Api\WorkerPasswordSetupController::class, 'setupPassword']);
Route::post('/workers/resend-setup-instructions', [\App\Http\Controllers\Api\WorkerPasswordSetupController::class, 'resendSetupInstructions']);

// Rating Routes
Route::middleware('auth:sanctum')->group(function () {
    // Submit rating for a worker
    Route::post('/ratings/workers', [RatingController::class, 'submitWorkerRating']);

    // Get ratings for a specific worker
    Route::get('/ratings/workers/{workerId}', [RatingController::class, 'getWorkerRatings']);

    // Get ratings given by a specific user
    Route::get('/ratings/users/{userId}', [RatingController::class, 'getUserRatings']);

    // Update a specific rating
    Route::put('/ratings/{ratingId}', [RatingController::class, 'updateRating']);

    // Delete a specific rating
    Route::delete('/ratings/{ratingId}', [RatingController::class, 'deleteRating']);

    // Service Request Routes
    Route::get('/service-requests', [ServiceRequestController::class, 'index']);
    Route::post('/service-requests', [ServiceRequestController::class, 'store']);
    Route::get('/service-requests/{id}', [ServiceRequestController::class, 'show']);
    Route::put('/service-requests/{id}', [ServiceRequestController::class, 'update']);
    Route::delete('/service-requests/{id}', [ServiceRequestController::class, 'destroy']);

    Route::get('/service-requests/user/{userId}', [ServiceRequestController::class, 'getUserServiceRequests']);
    Route::get('/service-requests/worker/{workerId}', [ServiceRequestController::class, 'getWorkerServiceRequests']);
    Route::post('/service-requests/{id}/assign-worker', [ServiceRequestController::class, 'assignWorker']);

    // Order Routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

    Route::get('/orders/user/{userId}', [OrderController::class, 'getUserOrders']);
    Route::get('/orders/worker/{workerId}', [OrderController::class, 'getWorkerOrders']);
    Route::post('/orders/{id}/assign-worker', [OrderController::class, 'assignWorker']);
    Route::get('/orders/tracking/{trackingId}', [OrderController::class, 'getOrderByTrackingId']);

    // Worker order management routes
    Route::post('/orders/{id}/accept', [OrderController::class, 'acceptOrder']);
    Route::post('/orders/{id}/reject', [OrderController::class, 'rejectOrder']);
    Route::get('/orders/assigned', [OrderController::class, 'getAssignedOrders']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateOrderStatus']);

    // Worker Routes
    Route::get('/workers', [WorkerController::class, 'index']);
    Route::get('/workers/{id}', [WorkerController::class, 'show']);
    Route::post('/workers', [WorkerController::class, 'store']);
    Route::put('/workers/{id}', [WorkerController::class, 'update']);
    Route::delete('/workers/{id}', [WorkerController::class, 'destroy']);
    Route::put('/workers/{id}/availability', [WorkerController::class, 'updateAvailability']);
    Route::put('/workers/{id}/location', [WorkerController::class, 'updateLocation']);
    Route::get('/workers/me', [WorkerController::class, 'me']);

    // Worker Password Setup Routes
    Route::post('/workers/setup-password', [\App\Http\Controllers\Api\WorkerPasswordSetupController::class, 'setupPassword']);
    Route::post('/workers/resend-setup-instructions', [\App\Http\Controllers\Api\WorkerPasswordSetupController::class, 'resendSetupInstructions']);

    // Shop Routes
    Route::get('/shop/location', [ShopController::class, 'getShopLocation']);
    Route::post('/shop/location', [ShopController::class, 'setShopLocation']);
    Route::get('/shops', [ShopController::class, 'index']);
    Route::post('/shops', [ShopController::class, 'store']);
    Route::get('/shops/{id}', [ShopController::class, 'show']);
    Route::put('/shops/{id}', [ShopController::class, 'update']);
    Route::delete('/shops/{id}', [ShopController::class, 'destroy']);
});
