<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Worker;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Get all orders with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Order::with(['user:id,name,email,profile_picture', 'worker:id,name,profile_picture,vehicle_type']);

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

            // Search by pickup/delivery location
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('pickup_location', 'like', "%{$search}%")
                      ->orWhere('delivery_location', 'like', "%{$search}%");
                });
            }

            // Order by created_at desc by default
            $query->orderBy('created_at', 'desc');

            $perPage = $request->get('per_page', 15);
            $orders = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new order from cart checkout
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'delivery_address' => 'required|string|max:255',
            'delivery_instructions' => 'nullable|string|max:1000',
            'delivery_latitude' => 'nullable|numeric|between:-90,90',
            'delivery_longitude' => 'nullable|numeric|between:-180,180',
            'total_amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|in:cash,card,wallet',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Generate tracking ID
            $trackingId = 'ORD-' . strtoupper(Str::random(8)) . '-' . time();

            // Create the order
            $user = auth()->user();
            $order = Order::create([
                'user_id' => $user->id,
                'pickup_location' => 'Store Location', // Default pickup location
                'delivery_location' => $request->delivery_address,
                'pickup_latitude' => 51.505, // Default coordinates
                'pickup_longitude' => -0.09,
                'delivery_latitude' => $request->delivery_latitude ?? 51.51,
                'delivery_longitude' => $request->delivery_longitude ?? -0.1,
                'distance' => 2.5, // Calculate actual distance
                'estimated_cost' => $request->total_amount,
                'actual_cost' => $request->total_amount,
                'status' => Order::STATUS_PENDING,
                'scheduled_time' => now()->addMinutes(30), // Default 30 minutes
                'notes' => $request->delivery_instructions,
                'package_description' => $this->formatPackageDescription($request->items),
                'payment_method' => $request->payment_method ?? 'cash',
                'payment_status' => Order::PAYMENT_PENDING,
                'tracking_id' => $trackingId,
                'recipient_name' => $user->name,
                'recipient_phone' => $user->phone ?? null,
            ]);

            // Store order items (you might want to create an OrderItem model)
            // For now, we'll store as JSON in the order
            $order->update([
                'order_items' => json_encode($request->items)
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order->load(['user:id,name,email,profile_picture'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific order
     */
    public function show($id): JsonResponse
    {
        try {
            $order = Order::with([
                'user:id,name,email,profile_picture',
                'worker:id,name,profile_picture,vehicle_type,phone',
                'ratings'
            ])->find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if user has permission to view this order
            if (auth()->id() != $order->user_id &&
                auth()->id() != $order->worker_id &&
                !auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view this order'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $order
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an order
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|required|in:pending,accepted,picked_up,in_transit,out_for_delivery,delivered,cancelled',
            'worker_id' => 'nullable|exists:workers,id',
            'actual_cost' => 'nullable|numeric|min:0',
            'delivered_at' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'payment_status' => 'nullable|in:pending,completed,failed,refunded',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $order = Order::find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check permissions
            $isOwner = auth()->id() == $order->user_id;
            $isAssignedWorker = auth()->id() == $order->worker_id;
            $isAdmin = auth()->user()->hasRole('admin');

            if (!$isOwner && !$isAssignedWorker && !$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this order'
                ], 403);
            }

            // Only allow certain fields to be updated by certain users
            $allowedFields = [];
            if ($isOwner || $isAdmin) {
                $allowedFields = ['notes', 'payment_status'];
            }
            if ($isAssignedWorker || $isAdmin) {
                $allowedFields = array_merge($allowedFields, ['status', 'actual_cost', 'delivered_at']);
            }
            if ($isAdmin) {
                $allowedFields = array_merge($allowedFields, ['worker_id']);
            }

            $updateData = array_intersect_key($request->all(), array_flip($allowedFields));

            // Set delivered_at when status changes to delivered
            if (isset($updateData['status']) && $updateData['status'] === Order::STATUS_DELIVERED) {
                $updateData['delivered_at'] = now();
            }

            $order->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully',
                'data' => $order->load(['user:id,name,email,profile_picture', 'worker:id,name,profile_picture,vehicle_type'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an order
     */
    public function destroy($id): JsonResponse
    {
        try {
            $order = Order::find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Only allow deletion of pending orders
            if ($order->status !== Order::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete order that is not pending'
                ], 422);
            }

            // Only allow owner or admin to delete
            if (auth()->id() != $order->user_id && !auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this order'
                ], 403);
            }

            $order->delete();

            return response()->json([
                'success' => true,
                'message' => 'Order deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders for a specific user
     */
    public function getUserOrders($userId): JsonResponse
    {
        // Allow users to view their own orders or admins to view any user's orders
        if (auth()->id() != $userId && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view these orders'
            ], 403);
        }

        try {
            $perPage = request()->get('per_page', 10);
            $page = request()->get('page', 1);

            $orders = Order::where('user_id', $userId)
                ->with(['worker:id,name,profile_picture,vehicle_type'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders for a specific worker
     */
    public function getWorkerOrders($workerId): JsonResponse
    {
        // Allow workers to view their own orders or admins to view any worker's orders
        if (auth()->id() != $workerId && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view these orders'
            ], 403);
        }

        try {
            $perPage = request()->get('per_page', 10);
            $page = request()->get('page', 1);

            $orders = Order::where('worker_id', $workerId)
                ->with(['user:id,name,email,profile_picture'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch worker orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a worker to an order
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
            $order = Order::find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Only admin can assign workers
            if (!auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to assign workers'
                ], 403);
            }

            $order->update([
                'worker_id' => $request->worker_id,
                'status' => Order::STATUS_ACCEPTED
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Worker assigned successfully',
                'data' => $order->load(['user:id,name,email,profile_picture', 'worker:id,name,profile_picture,vehicle_type'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign worker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order by tracking ID
     */
    public function getOrderByTrackingId($trackingId): JsonResponse
    {
        try {
            $order = Order::with([
                'user:id,name,email,profile_picture',
                'worker:id,name,profile_picture,vehicle_type,phone',
                'ratings'
            ])->where('tracking_id', $trackingId)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if user has permission to view this order
            if (auth()->id() != $order->user_id &&
                auth()->id() != $order->worker_id &&
                !auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view this order'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $order
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Worker accepts an order
     */
    public function acceptOrder(Request $request, $id): JsonResponse
    {
        try {
            $order = Order::find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if order is assigned to current user (worker)
            $worker = auth()->user();
            if ($order->worker_id != $worker->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to accept this order'
                ], 403);
            }

            // Check if order can be accepted
            if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_ASSIGNED])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order cannot be accepted at this stage'
                ], 422);
            }

            $order->update([
                'status' => Order::STATUS_ACCEPTED,
                'accepted_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order accepted successfully',
                'data' => $order->load(['user:id,name,email,profile_picture'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Worker rejects an order
     */
    public function rejectOrder(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $order = Order::find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if order is assigned to current user (worker)
            $worker = auth()->user();
            if ($order->worker_id != $worker->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to reject this order'
                ], 403);
            }

            // Check if order can be rejected
            if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_ASSIGNED])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order cannot be rejected at this stage'
                ], 422);
            }

            $order->update([
                'status' => Order::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->reason,
                'worker_id' => null // Unassign worker
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order rejected successfully',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders assigned to current worker
     */
    public function getAssignedOrders(): JsonResponse
    {
        try {
            $worker = auth()->user();

            // Since the authenticated user is the Worker model itself
            $orders = Order::where('worker_id', $worker->id)
                ->with(['user:id,name,email,profile_picture'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assigned orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status (for workers)
     */
    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:accepted,picked_up,in_transit,out_for_delivery,delivered',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $order = Order::find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if order is assigned to current user (worker)
            $worker = auth()->user();
            if ($order->worker_id != $worker->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this order'
                ], 403);
            }

            // Validate status progression
            $validTransitions = [
                Order::STATUS_ASSIGNED => [Order::STATUS_ACCEPTED],
                Order::STATUS_ACCEPTED => [Order::STATUS_PICKED_UP],
                Order::STATUS_PICKED_UP => [Order::STATUS_IN_TRANSIT],
                Order::STATUS_IN_TRANSIT => [Order::STATUS_OUT_FOR_DELIVERY],
                Order::STATUS_OUT_FOR_DELIVERY => [Order::STATUS_DELIVERED],
            ];

            if (!in_array($request->status, $validTransitions[$order->status] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid status transition'
                ], 422);
            }

            $updateData = ['status' => $request->status];

            // Set timestamps based on status
            switch ($request->status) {
                case Order::STATUS_PICKED_UP:
                    $updateData['picked_up_at'] = now();
                    break;
                case Order::STATUS_DELIVERED:
                    $updateData['delivered_at'] = now();
                    break;
            }

            $order->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'data' => $order->load(['user:id,name,email,profile_picture'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to format package description from cart items
     */
    private function formatPackageDescription($items): string
    {
        $descriptions = [];
        foreach ($items as $item) {
            $descriptions[] = $item['name'] ?? 'Item';
        }
        return implode(', ', $descriptions);
    }
}
