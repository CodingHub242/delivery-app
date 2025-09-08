<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class WorkerAuthController extends Controller
{
    /**
     * Worker login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $worker = Worker::where('phone_number', $request->phone_number)->first();

            if (!$worker || !Hash::check($request->password, $worker->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Create token for worker
            $token = $worker->createToken('worker-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'user' => $worker
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Worker registration
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20|unique:workers',
            'password' => 'required|string|min:6',
            'worker_type' => 'required|string|in:delivery_driver,service_worker',
            'vehicle_type' => 'required_if:worker_type,delivery_driver|string|in:motorcycle,car,van,truck,bicycle',
            'vehicle_registration' => 'required_if:worker_type,delivery_driver|string|max:50',
            'service_type' => 'required_if:worker_type,service_worker|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $worker = Worker::create([
                'name' => $request->name,
                'phone_number' => $request->phone_number,
                'password' => Hash::make($request->password),
                'vehicle_type' => $request->vehicle_type,
                'vehicle_registration' => $request->vehicle_registration,
                'is_available' => true,
                'worker_type' => $request->worker_type,
                'service_type' => $request->service_type ?? null,
                'service_id' => 1, // Default service ID, you might want to make this configurable
            ]);

            // Create token for the new worker
            $token = $worker->createToken('worker-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'token' => $token,
                    'user' => $worker
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated worker details
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $worker = $request->user();

            return response()->json([
                'success' => true,
                'data' => $worker
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get worker details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Worker logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
