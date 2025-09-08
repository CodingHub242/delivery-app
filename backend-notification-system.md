# Laravel Backend Notification System

## Database Migration
```php
// database/migrations/2024_01_01_create_promotional_notifications_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotional_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->timestamps();
        });

        Schema::create('notification_seen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('promotional_notifications')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('seen_date');
            $table->timestamps();
            
            $table->unique(['notification_id', 'user_id', 'seen_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_seen');
        Schema::dropIfExists('promotional_notifications');
    }
};
```

## Model
```php
// app/Models/PromotionalNotification.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromotionalNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'image_url',
        'is_active',
        'start_date',
        'end_date'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function seenRecords(): HasMany
    {
        return $this->hasMany(NotificationSeen::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                  ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', now());
            });
    }
}

// app/Models/NotificationSeen.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationSeen extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_id',
        'user_id',
        'seen_date'
    ];

    protected $casts = [
        'seen_date' => 'date',
    ];

    public function notification()
    {
        return $this->belongsTo(PromotionalNotification::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

## Controller
```php
// app/Http/Controllers/Api/PromotionalNotificationController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromotionalNotification;
use App\Models\NotificationSeen;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;

class PromotionalNotificationController extends Controller
{
    public function index()
    {
        try {
            $notifications = PromotionalNotification::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $notifications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getActiveNotifications()
    {
        try {
            $notifications = PromotionalNotification::active()->get();
            
            return response()->json([
                'success' => true,
                'data' => $notifications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active notifications'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $notification = PromotionalNotification::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Notification created successfully',
                'data' => $notification
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create notification'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show($id)
    {
        try {
            $notification = PromotionalNotification::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $notification
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], Response::HTTP_NOT_FOUND);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'message' => 'sometimes|required|string',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $notification = PromotionalNotification::findOrFail($id);
            $notification->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Notification updated successfully',
                'data' => $notification
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notification'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy($id)
    {
        try {
            $notification = PromotionalNotification::findOrFail($id);
            $notification->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function markAsSeen($id, Request $request)
    {
        try {
            $user = auth()->user();
            $notification = PromotionalNotification::findOrFail($id);
            
            // Check if already marked as seen today
            $alreadySeen = NotificationSeen::where('notification_id', $id)
                ->where('user_id', $user->id)
                ->whereDate('seen_date', now()->toDateString())
                ->exists();
            
            if (!$alreadySeen) {
                NotificationSeen::create([
                    'notification_id' => $id,
                    'user_id' => $user->id,
                    'seen_date' => now()->toDateString()
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Notification marked as seen'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as seen'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
```

## Routes
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Promotional Notifications
    Route::get('/promotional-notifications', [PromotionalNotificationController::class, 'getActiveNotifications']);
    Route::post('/promotional-notifications/{id}/mark-seen', [PromotionalNotificationController::class, 'markAsSeen']);
    
    // Admin routes (protected by admin middleware)
    Route::middleware('admin')->group(function () {
        Route::get('/admin/promotional-notifications', [PromotionalNotificationController::class, 'index']);
        Route::post('/promotional-notifications', [PromotionalNotificationController::class, 'store']);
        Route::get('/promotional-notifications/{id}', [PromotionalNotificationController::class, 'show']);
        Route::put('/promotional-notifications/{id}', [PromotionalNotificationController::class, 'update']);
        Route::delete('/promotional-notifications/{id}', [PromotionalNotificationController::class, 'destroy']);
    });
});
```

## Middleware (if needed)
```php
// app/Http/Middleware/AdminMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check() || !auth()->user()->is_admin) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        return $next($request);
    }
}
```

## Usage Instructions

1. **Run Migrations:**
```bash
php artisan migrate
```

2. **Create Notifications (Admin):**
```bash
# Create a new notification
POST /api/promotional-notifications
{
    "title": "Special Offer",
    "message": "Get 20% off on all deliveries this week!",
    "image_url": "https://example.com/special-offer.jpg",
    "is_active": true,
    "start_date": "2024-01-15",
    "end_date": "2024-01-22"
}
```

3. **Get Active Notifications (Users):**
```bash
GET /api/promotional-notifications
```

4. **Mark as Seen:**
```bash
POST /api/promotional-notifications/1/mark-seen
```

5. **Admin Management:**
```bash
# Get all notifications
GET /api/admin/promotional-notifications

# Update notification
PUT /api/promotional-notifications/1
{
    "is_active": false
}

# Delete notification
DELETE /api/promotional-notifications/1
```

This backend implementation provides complete CRUD functionality for promotional notifications with proper authentication, validation, and user tracking for seen notifications.
