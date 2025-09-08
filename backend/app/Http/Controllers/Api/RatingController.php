<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    /**
     * Submit a rating for a worker
     */
    public function submitWorkerRating(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'worker_id' => 'required|exists:workers,id',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
            'order_id' => 'nullable|exists:orders,id',
            'service_request_id' => 'nullable|exists:service_requests,id',
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

            // Check if user already rated this worker for this order/service request
            $existingRating = Rating::where('user_id', auth()->id())
                ->where('worker_id', $request->worker_id)
                ->where(function ($query) use ($request) {
                    if ($request->order_id) {
                        $query->where('order_id', $request->order_id);
                    }
                    if ($request->service_request_id) {
                        $query->where('service_request_id', $request->service_request_id);
                    }
                })
                ->first();

            if ($existingRating) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already rated this worker for this order/service request'
                ], 409);
            }

            // Create the rating
            $rating = Rating::create([
                'user_id' => auth()->id(),
                'worker_id' => $request->worker_id,
                'order_id' => $request->order_id,
                'service_request_id' => $request->service_request_id,
                'rating' => $request->rating,
                'review' => $request->review,
            ]);

            // Update worker's rating statistics
            $worker = Worker::find($request->worker_id);
            $worker->updateRatingStats();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Rating submitted successfully',
                'data' => $rating->load(['user', 'worker'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit rating',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ratings for a specific worker
     */
    public function getWorkerRatings(Request $request, $workerId): JsonResponse
    {
        $validator = Validator::make(['worker_id' => $workerId], [
            'worker_id' => 'required|exists:workers,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid worker ID'
            ], 404);
        }

        try {
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);

            $ratings = Rating::where('worker_id', $workerId)
                ->with(['user:id,name,profile_picture', 'order:id', 'serviceRequest:id'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Get rating statistics
            $stats = Rating::where('worker_id', $workerId)
                ->selectRaw('
                    COUNT(*) as total_ratings,
                    AVG(rating) as average_rating,
                    MIN(rating) as min_rating,
                    MAX(rating) as max_rating
                ')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'ratings' => $ratings,
                    'statistics' => [
                        'total_ratings' => (int) $stats->total_ratings,
                        'average_rating' => round($stats->average_rating ?? 0, 2),
                        'min_rating' => (int) $stats->min_rating,
                        'max_rating' => (int) $stats->max_rating,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch worker ratings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ratings given by a specific user
     */
    public function getUserRatings(Request $request, $userId): JsonResponse
    {
        // Allow users to view their own ratings or admins to view any user's ratings
        if (auth()->id() != $userId && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view these ratings'
            ], 403);
        }

        try {
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);

            $ratings = Rating::where('user_id', $userId)
                ->with(['worker:id,name,profile_picture,vehicle_type', 'order:id', 'serviceRequest:id'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $ratings
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user ratings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a rating
     */
    public function updateRating(Request $request, $ratingId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rating = Rating::where('id', $ratingId)
                ->where('user_id', auth()->id())
                ->first();

            if (!$rating) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rating not found or you do not have permission to update it'
                ], 404);
            }

            DB::beginTransaction();

            $rating->update([
                'rating' => $request->rating,
                'review' => $request->review,
            ]);

            // Update worker's rating statistics
            $rating->worker->updateRatingStats();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Rating updated successfully',
                'data' => $rating->load(['user', 'worker'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update rating',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a rating
     */
    public function deleteRating($ratingId): JsonResponse
    {
        try {
            $rating = Rating::where('id', $ratingId)
                ->where('user_id', auth()->id())
                ->first();

            if (!$rating) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rating not found or you do not have permission to delete it'
                ], 404);
            }

            DB::beginTransaction();

            $workerId = $rating->worker_id;
            $rating->delete();

            // Update worker's rating statistics
            $worker = Worker::find($workerId);
            $worker->updateRatingStats();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Rating deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete rating',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
