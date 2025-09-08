# Laravel Backend Profile Management System

## Database Migration (if needed for profile pictures)
```php
// database/migrations/2024_01_01_add_profile_picture_to_users_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_picture')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_picture');
        });
    }
};
```

## Controller
```php
// app/Http/Controllers/Api/UserProfileController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserProfileController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $user->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $user->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = auth()->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to change password'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function uploadProfilePicture(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = auth()->user();

        try {
            // Delete old profile picture if exists
            if ($user->profile_picture) {
                Storage::delete($user->profile_picture);
            }

            // Store new profile picture
            $path = $request->file('profile_picture')->store('profile-pictures', 'public');

            $user->update([
                'profile_picture' => $path
            ]);

            // Generate full URL for the image
            $imageUrl = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture uploaded successfully',
                'image_url' => $imageUrl,
                'user' => $user->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile picture'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getProfile()
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }
}
```

## Routes
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // User Profile Routes
    Route::prefix('user')->group(function () {
        Route::get('/profile', [UserProfileController::class, 'getProfile']);
        Route::put('/profile', [UserProfileController::class, 'updateProfile']);
        Route::put('/password', [UserProfileController::class, 'changePassword']);
        Route::post('/profile-picture', [UserProfileController::class, 'uploadProfilePicture']);
    });
    
    // ... other routes
});
```

## Model Update
```php
// app/Models/User.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'profile_picture',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = ['profile_picture_url'];

    public function getProfilePictureUrlAttribute()
    {
        if ($this->profile_picture) {
            return Storage::disk('public')->url($this->profile_picture);
        }
        
        return null;
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isWorker()
    {
        return $this->role === 'worker';
    }

    public function isCustomer()
    {
        return $this->role === 'customer';
    }
}
```

## Usage Instructions

1. **Run Migrations:**
```bash
php artisan migrate
```

2. **Update Profile:**
```bash
PUT /api/user/profile
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country"
}
```

3. **Change Password:**
```bash
PUT /api/user/password
{
    "current_password": "oldpassword123",
    "new_password": "newpassword456",
    "new_password_confirmation": "newpassword456"
}
```

4. **Upload Profile Picture:**
```bash
POST /api/user/profile-picture
Content-Type: multipart/form-data

profile_picture: [file]
```

5. **Get Profile:**
```bash
GET /api/user/profile
```

## Response Examples

**Success Response (Profile Update):**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Main St, City, Country",
        "profile_picture": "profile-pictures/abc123.jpg",
        "profile_picture_url": "http://localhost/storage/profile-pictures/abc123.jpg",
        "role": "customer"
    }
}
```

**Error Response (Invalid Password):**
```json
{
    "success": false,
    "message": "Current password is incorrect"
}
```

**Error Response (Validation):**
```json
{
    "success": false,
    "errors": {
        "email": ["The email has already been taken."]
    }
}
```

