<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ShopController extends Controller
{
    /**
     * Get the active shop location
     */
    public function getShopLocation(): JsonResponse
    {
        try {
            $shop = Shop::active()->first();

            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active shop location found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'address' => $shop->address,
                    'latitude' => $shop->latitude,
                    'longitude' => $shop->longitude,
                    'phone' => $shop->phone,
                    'email' => $shop->email,
                    'description' => $shop->description,
                    'is_active' => $shop->is_active
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch shop location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set or update the shop location
     */
    public function setShopLocation(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Deactivate all existing shops first
            Shop::where('is_active', true)->update(['is_active' => false]);

            // Create or update the shop location
            $shop = Shop::updateOrCreate(
                ['is_active' => false], // This will never match since we deactivated all
                [
                    'name' => $request->name,
                    'address' => $request->address,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'phone' => $request->phone,
                    'email' => $request->email,
                    'description' => $request->description,
                    'is_active' => true
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Shop location updated successfully',
                'data' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'address' => $shop->address,
                    'latitude' => $shop->latitude,
                    'longitude' => $shop->longitude,
                    'phone' => $shop->phone,
                    'email' => $shop->email,
                    'description' => $shop->description,
                    'is_active' => $shop->is_active
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shop location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all shop locations (admin only)
     */
    public function index(): JsonResponse
    {
        try {
            // Check if user is admin
            if (!auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view shop locations'
                ], 403);
            }

            $shops = Shop::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $shops
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch shop locations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new shop location (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to create shop locations'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $shop = Shop::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Shop location created successfully',
                'data' => $shop
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create shop location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific shop location
     */
    public function show($id): JsonResponse
    {
        try {
            $shop = Shop::find($id);

            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop location not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $shop
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch shop location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a shop location (admin only)
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update shop locations'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:500',
            'latitude' => 'sometimes|required|numeric|between:-90,90',
            'longitude' => 'sometimes|required|numeric|between:-180,180',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $shop = Shop::find($id);

            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop location not found'
                ], 404);
            }

            $shop->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Shop location updated successfully',
                'data' => $shop
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shop location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a shop location (admin only)
     */
    public function destroy($id): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete shop locations'
            ], 403);
        }

        try {
            $shop = Shop::find($id);

            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop location not found'
                ], 404);
            }

            $shop->delete();

            return response()->json([
                'success' => true,
                'message' => 'Shop location deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete shop location',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
