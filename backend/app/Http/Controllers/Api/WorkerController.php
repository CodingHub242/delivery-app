<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Worker;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class WorkerController extends Controller
{
    /**
     * Get all workers
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Worker::with(['user:id,name,email,profile_picture']);

            // Filter by availability
            if ($request->has('available')) {
                $query->where('is_available', $request->boolean('available'));
            }

            // Filter by vehicle type
            if ($request->has('vehicle_type')) {
                $query->where('vehicle_type', $request->vehicle_type);
            }

            // Search by name
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            $workers = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $workers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch workers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific worker
     */
    public function show($id): JsonResponse
    {
        try {
            $worker = Worker::with(['user:id,name,email,profile_picture'])->find($id);

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $worker
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch worker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new worker
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20|unique:workers,phone_number',
            'worker_type' => 'required|string|in:delivery_driver,service_worker',
            'vehicle_type' => 'nullable|string|max:100',
            'vehicle_registration' => 'nullable|string|max:50',
            'service_type' => 'nullable|string|max:100',
            'is_available' => 'boolean',
            'current_latitude' => 'nullable|numeric|between:-90,90',
            'current_longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate a temporary password setup token
            $setupToken = \Illuminate\Support\Str::random(32);

            $workerData = $request->all();
            $workerData['password'] = null; // No password initially
            $workerData['password_setup_token'] = $setupToken;
            $workerData['is_available'] = $request->is_available ?? true;

            $worker = Worker::create($workerData);

            // TODO: Send SMS/Email with password setup link
            // For now, we'll return the setup token in the response
            // In production, this should be sent via SMS/Email

            return response()->json([
                'success' => true,
                'message' => 'Worker created successfully. Password setup instructions will be sent via SMS.',
                'data' => $worker,
                'setup_info' => [
                    'setup_token' => $setupToken,
                    'setup_url' => env('APP_URL') . '/worker/setup-password/' . $setupToken
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create worker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a worker
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'vehicle_type' => 'sometimes|required|string|max:100',
            'vehicle_registration' => 'nullable|string|max:50',
            'is_available' => 'boolean',
            'current_latitude' => 'nullable|numeric|between:-90,90',
            'current_longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $worker = Worker::find($id);

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker not found'
                ], 404);
            }

            $worker->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Worker updated successfully',
                'data' => $worker->load(['user:id,name,email,profile_picture'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update worker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a worker
     */
    public function destroy($id): JsonResponse
    {
        try {
            $worker = Worker::find($id);

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker not found'
                ], 404);
            }

            $worker->delete();

            return response()->json([
                'success' => true,
                'message' => 'Worker deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete worker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update worker availability
     */
    public function updateAvailability(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'is_available' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $worker = Worker::find($id);

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker not found'
                ], 404);
            }

            $worker->update(['is_available' => $request->is_available]);

            return response()->json([
                'success' => true,
                'message' => 'Worker availability updated successfully',
                'data' => $worker
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update worker availability',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update worker location
     */
    public function updateLocation(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_latitude' => 'required|numeric|between:-90,90',
            'current_longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $worker = Worker::find($id);

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker not found'
                ], 404);
            }

            $worker->update([
                'current_latitude' => $request->current_latitude,
                'current_longitude' => $request->current_longitude,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Worker location updated successfully',
                'data' => $worker
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update worker location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user's worker profile
     */
    public function me(): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user->isWorker()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a worker'
                ], 403);
            }

            $worker = $user->worker;

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker profile not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $worker->load(['user:id,name,email,profile_picture'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch worker profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
