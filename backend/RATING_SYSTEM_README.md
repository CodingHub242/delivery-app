# Worker Rating System - Laravel Backend

This document provides the complete Laravel backend implementation for the worker rating system in the delivery app.

## Overview

The rating system allows customers to rate workers (drivers and service workers) after completed deliveries or service requests. The system includes:

- ⭐ Star-based rating (1-5 stars)
- 📝 Optional review text
- 📊 Rating statistics and analytics
- 🔒 User authentication and validation
- 🚫 Duplicate rating prevention

## Database Schema

### Ratings Table

```sql
CREATE TABLE ratings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    worker_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    service_request_id BIGINT UNSIGNED NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE SET NULL,

    UNIQUE KEY unique_user_worker_order_rating (user_id, worker_id, order_id),
    UNIQUE KEY unique_user_worker_service_rating (user_id, worker_id, service_request_id),
    INDEX idx_worker_created_at (worker_id, created_at),
    INDEX idx_user_created_at (user_id, created_at),
    INDEX idx_rating (rating)
);
```

### Worker Table Updates

Add these columns to your existing `workers` table:

```sql
ALTER TABLE workers ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE workers ADD COLUMN total_ratings INT DEFAULT 0;
ALTER TABLE workers ADD COLUMN rating_count INT DEFAULT 0;
```

## Installation & Setup

### 1. Run Migration

```bash
php artisan migrate
```

### 2. Run Seeder (Optional - for sample data)

```bash
php artisan db:seed --class=RatingSeeder
```

### 3. Update Worker Model

Ensure your `Worker` model includes the rating fields and relationships:

```php
// In app/Models/Worker.php
protected $fillable = [
    // ... existing fields
    'average_rating',
    'total_ratings',
    'rating_count',
];

// Add relationship
public function ratings()
{
    return $this->hasMany(Rating::class);
}

// Add rating calculation method
public function updateRatingStats()
{
    $ratingStats = $this->ratings()
        ->selectRaw('COUNT(*) as count, AVG(rating) as average, SUM(rating) as total')
        ->first();

    $this->update([
        'rating_count' => $ratingStats->count ?? 0,
        'average_rating' => $ratingStats->average ? round($ratingStats->average, 2) : 0,
        'total_ratings' => $ratingStats->total ?? 0,
    ]);
}
```

## API Endpoints

All endpoints require authentication via Sanctum token.

### Submit Rating

**POST** `/api/ratings/workers`

Submit a rating for a worker.

**Request Body:**
```json
{
    "worker_id": 1,
    "rating": 5,
    "review": "Excellent service!",
    "order_id": 123,
    "service_request_id": null
}
```

**Response:**
```json
{
    "success": true,
    "message": "Rating submitted successfully",
    "data": {
        "id": 1,
        "user_id": 5,
        "worker_id": 1,
        "rating": 5,
        "review": "Excellent service!",
        "created_at": "2024-01-01T10:00:00Z"
    }
}
```

### Get Worker Ratings

**GET** `/api/ratings/workers/{workerId}?page=1&per_page=10`

Get all ratings for a specific worker with pagination.

**Response:**
```json
{
    "success": true,
    "data": {
        "ratings": {
            "current_page": 1,
            "data": [...],
            "total": 25,
            "per_page": 10
        },
        "statistics": {
            "total_ratings": 25,
            "average_rating": 4.6,
            "min_rating": 3,
            "max_rating": 5
        }
    }
}
```

### Get User Ratings

**GET** `/api/ratings/users/{userId}?page=1&per_page=10`

Get all ratings submitted by a specific user.

### Update Rating

**PUT** `/api/ratings/{ratingId}`

Update an existing rating (users can only update their own ratings).

### Delete Rating

**DELETE** `/api/ratings/{ratingId}`

Delete a rating (users can only delete their own ratings).

## Usage Examples

### Frontend Integration

```javascript
// Submit a rating
const submitRating = async (workerId, rating, review, orderId) => {
    const response = await fetch('/api/ratings/workers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            worker_id: workerId,
            rating: rating,
            review: review,
            order_id: orderId
        })
    });

    const result = await response.json();
    return result;
};

// Get worker ratings
const getWorkerRatings = async (workerId, page = 1) => {
    const response = await fetch(`/api/ratings/workers/${workerId}?page=${page}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();
    return result;
};
```

## Security Features

1. **Authentication Required**: All rating endpoints require valid Sanctum tokens
2. **Authorization Checks**: Users can only modify their own ratings
3. **Duplicate Prevention**: Unique constraints prevent duplicate ratings for same user-worker-order combinations
4. **Input Validation**: Comprehensive validation for all rating data
5. **SQL Injection Protection**: Uses Eloquent ORM with proper parameter binding

## Performance Optimizations

1. **Database Indexes**: Optimized indexes on frequently queried columns
2. **Eager Loading**: Relationships are eager loaded to prevent N+1 queries
3. **Pagination**: Large result sets are paginated
4. **Caching**: Consider implementing caching for rating statistics

## Error Handling

The API returns consistent error responses:

```json
{
    "success": false,
    "message": "Error description",
    "errors": {
        "field": ["Error details"]
    }
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `404`: Not Found
- `409`: Conflict (duplicate rating)
- `422`: Validation Error
- `500`: Server Error

## Testing

### Unit Tests

```php
// Example test for rating submission
public function test_user_can_submit_rating()
{
    $user = User::factory()->create();
    $worker = Worker::factory()->create();
    $order = Order::factory()->create(['worker_id' => $worker->id]);

    $this->actingAs($user, 'sanctum');

    $response = $this->postJson('/api/ratings/workers', [
        'worker_id' => $worker->id,
        'rating' => 5,
        'review' => 'Great service!',
        'order_id' => $order->id
    ]);

    $response->assertStatus(201)
             ->assertJson(['success' => true]);

    $this->assertDatabaseHas('ratings', [
        'user_id' => $user->id,
        'worker_id' => $worker->id,
        'rating' => 5
    ]);
}
```

## Monitoring & Analytics

Consider implementing:

1. **Rating Analytics Dashboard**: Admin interface for rating statistics
2. **Worker Performance Metrics**: Track rating trends over time
3. **Customer Satisfaction Reports**: Aggregate rating data for insights
4. **Automated Alerts**: Notify admins of consistently low-rated workers

## Future Enhancements

1. **Rating Categories**: Allow ratings for specific aspects (punctuality, professionalism, etc.)
2. **Photo Reviews**: Allow customers to attach photos to reviews
3. **Rating Verification**: Verify ratings based on delivery completion
4. **Rating Appeals**: Allow workers to respond to negative reviews
5. **Rating Analytics**: Advanced analytics and reporting features

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure all foreign key tables exist before running migrations
2. **Authentication Issues**: Verify Sanctum token is properly configured
3. **Duplicate Ratings**: Check unique constraints are working as expected
4. **Performance Issues**: Add proper indexes and consider caching

### Debug Commands

```bash
# Check rating statistics
php artisan tinker
>>> App\Models\Worker::find(1)->ratings()->avg('rating')

# Clear ratings for testing
php artisan tinker
>>> App\Models\Rating::truncate()
```

This completes the Laravel backend implementation for the worker rating system. The system is production-ready and includes comprehensive error handling, security measures, and performance optimizations.
