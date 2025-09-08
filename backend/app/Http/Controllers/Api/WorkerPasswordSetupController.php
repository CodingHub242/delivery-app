<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class WorkerPasswordSetupController extends Controller
{
    /**
     * Show the password setup form for a worker
     */
    public function showSetupForm($token)
    {
        $worker = Worker::where('password_setup_token', $token)->first();

        if (!$worker) {
            return view('worker.password-setup', [
                'error' => 'Invalid or expired setup token',
                'token' => $token
            ]);
        }

        // Check if password is already set
        if ($worker->password) {
            return view('worker.password-setup', [
                'error' => 'Password has already been set for this account',
                'token' => $token
            ]);
        }

        return view('worker.password-setup', [
            'token' => $token,
            'worker' => $worker
        ]);
    }

    /**
     * Set up password for a worker using setup token
     */
    public function setupPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $worker = Worker::where('password_setup_token', $request->token)->first();

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired setup token'
                ], 404);
            }

            // Check if password is already set
            if ($worker->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password has already been set for this account'
                ], 400);
            }

            // Update worker with password and clear setup token
            $worker->update([
                'password' => Hash::make($request->password),
                'password_setup_token' => null,
            ]);

            // Create token for immediate login
            $token = $worker->createToken('worker-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Password set successfully',
                'data' => [
                    'token' => $token,
                    'user' => $worker
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to set password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resend password setup instructions
     */
    public function resendSetupInstructions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
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

            if (!$worker) {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker not found'
                ], 404);
            }

            // Check if password is already set
            if ($worker->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password has already been set for this account'
                ], 400);
            }

            // Generate new setup token
            $setupToken = \Illuminate\Support\Str::random(32);
            $worker->update(['password_setup_token' => $setupToken]);

            // TODO: Send SMS/Email with new setup link
            // For now, return the setup info

            return response()->json([
                'success' => true,
                'message' => 'Password setup instructions sent successfully',
                'setup_info' => [
                    'setup_token' => $setupToken,
                    'setup_url' => env('APP_URL') . '/worker/setup-password/' . $setupToken
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resend setup instructions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
