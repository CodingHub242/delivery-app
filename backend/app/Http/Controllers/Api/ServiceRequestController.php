<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\Service;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ServiceRequestController extends Controller
{
    /**
     * Get all service requests with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ServiceRequest::with(['user:id,name,email,profile_picture', 'service:id,name,description', 'worker:id,name,profile_picture,vehicle_type']);

            // Filter by user_id if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Filter by worker_id if provided
            if ($request->has('worker_id')) {
                $query->where('worker_id', $request->worker_id);
            }

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by priority if provided
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // Search by title or description
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Order by created_at desc by default
            $query->orderBy('created_at', 'desc');

            $perPage = $request->get('per_page', 15);
            $serviceRequests = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $serviceRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new service request
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|exists:services,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date|after:today',
            'scheduled_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'estimated_cost' => 'nullable|numeric|min:0',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'special_instructions' => 'nullable|string|max:1000',
            'images' => 'nullable|array',
            'images.*' => 'url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $serviceRequest = ServiceRequest::create([
                'user_id' => auth()->id(),
                'service_id' => $request->service_id,
                'title' => $request->title,
                'description' => $request->description,
                'status' => ServiceRequest::STATUS_PENDING,
                'priority' => $request->priority ?? ServiceRequest::PRIORITY_MEDIUM,
                'scheduled_date' => $request->scheduled_date,
                'scheduled_time' => $request->scheduled_time,
                'location' => $request->location,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'estimated_cost' => $request->estimated_cost,
                'contact_phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'special_instructions' => $request->special_instructions,
                'images' => $request->images
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Service request created successfully',
                'data' => $serviceRequest->load(['user:id,name,email,profile_picture', 'service:id,name,description'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific service request
     */
    public function show($id): JsonResponse
    {
        try {
            $serviceRequest = ServiceRequest::with([
                'user:id,name,email,profile_picture',
                'service:id,name,description,category',
                'worker:id,name,profile_picture,vehicle_type,phone',
                'ratings'
            ])->find($id);

            if (!$serviceRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Check if user has permission to view this request
            if (auth()->id() != $serviceRequest->user_id &&
                auth()->id() != $serviceRequest->worker_id &&
                !auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view this service request'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $serviceRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a service request
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string|max:1000',
            'status' => 'sometimes|required|in:pending,accepted,in_progress,completed,cancelled,rejected',
            'priority' => 'sometimes|required|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date|after:today',
            'scheduled_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'estimated_cost' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'worker_id' => 'nullable|exists:workers,id',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'special_instructions' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'images' => 'nullable|array',
            'images.*' => 'url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $serviceRequest = ServiceRequest::find($id);

            if (!$serviceRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Check permissions
            $isOwner = auth()->id() == $serviceRequest->user_id;
            $isAssignedWorker = auth()->id() == $serviceRequest->worker_id;
            $isAdmin = auth()->user()->hasRole('admin');

            if (!$isOwner && !$isAssignedWorker && !$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this service request'
                ], 403);
            }

            // Only allow certain fields to be updated by certain users
            $allowedFields = [];
            if ($isOwner || $isAdmin) {
                $allowedFields = ['title', 'description', 'priority', 'scheduled_date', 'scheduled_time',
                                'location', 'latitude', 'longitude', 'estimated_cost', 'contact_phone',
                                'contact_email', 'special_instructions', 'images'];
            }
            if ($isAssignedWorker || $isAdmin) {
                $allowedFields = array_merge($allowedFields, ['status', 'actual_cost', 'notes']);
            }
            if ($isAdmin) {
                $allowedFields = array_merge($allowedFields, ['worker_id']);
            }

            $updateData = array_intersect_key($request->all(), array_flip($allowedFields));
            $serviceRequest->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Service request updated successfully',
                'data' => $serviceRequest->load(['user:id,name,email,profile_picture', 'service:id,name,description', 'worker:id,name,profile_picture,vehicle_type'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a service request
     */
    public function destroy($id): JsonResponse
    {
        try {
            $serviceRequest = ServiceRequest::find($id);

            if (!$serviceRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Only allow owner or admin to delete
            if (auth()->id() != $serviceRequest->user_id && !auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this service request'
                ], 403);
            }

            // Only allow deletion of pending requests
            if ($serviceRequest->status !== ServiceRequest::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete service request that is not pending'
                ], 422);
            }

            $serviceRequest->delete();

            return response()->json([
                'success' => true,
                'message' => 'Service request deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service requests for a specific user
     */
    public function getUserServiceRequests($userId): JsonResponse
    {
        // Allow users to view their own requests or admins to view any user's requests
        if (auth()->id() != $userId && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view these service requests'
            ], 403);
        }

        try {
            $perPage = request()->get('per_page', 10);
            $page = request()->get('page', 1);

            $serviceRequests = ServiceRequest::where('user_id', $userId)
                ->with(['service:id,name,description', 'worker:id,name,profile_picture,vehicle_type'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $serviceRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user service requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service requests for a specific worker
     */
    public function getWorkerServiceRequests($workerId): JsonResponse
    {
        // Allow workers to view their own requests or admins to view any worker's requests
        if (auth()->id() != $workerId && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view these service requests'
            ], 403);
        }

        try {
            $perPage = request()->get('per_page', 10);
            $page = request()->get('page', 1);

            $serviceRequests = ServiceRequest::where('worker_id', $workerId)
                ->with(['user:id,name,email,profile_picture', 'service:id,name,description'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $serviceRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch worker service requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a worker to a service request
     */
    public function assignWorker(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'worker_id' => 'required|exists:workers,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $serviceRequest = ServiceRequest::find($id);

            if (!$serviceRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Only admin can assign workers
            if (!auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to assign workers'
                ], 403);
            }

            $serviceRequest->update([
                'worker_id' => $request->worker_id,
                'status' => ServiceRequest::STATUS_ACCEPTED
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Worker assigned successfully',
                'data' => $serviceRequest->load(['user:id,name,email,profile_picture', 'service:id,name,description', 'worker:id,name,profile_picture,vehicle_type'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign worker',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
