<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Auth\Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Worker extends Model implements Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $fillable = [
        'user_id',
        'name',
        'phone_number',
        'worker_type',
        'service_type',
        'vehicle_type',
        'vehicle_registration',
        'profile_picture',
        'password',
        'password_setup_token',
        'remember_token',
        'is_available',
        'current_latitude',
        'current_longitude',
        'average_rating',
        'total_ratings',
        'rating_count',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'current_latitude' => 'decimal:8',
        'current_longitude' => 'decimal:8',
        'average_rating' => 'decimal:2',
        'total_ratings' => 'integer',
        'rating_count' => 'integer',
    ];

    protected $hidden = [
        'password',
        'password_setup_token',
        'remember_token',
    ];

    // Relationships

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class);
    }

    // Rating calculation methods

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

    public function getRatingPercentageAttribute()
    {
        if ($this->rating_count === 0) {
            return 0;
        }

        return round(($this->average_rating / 5) * 100, 1);
    }

    // Scopes

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeHighlyRated($query, $minRating = 4.0)
    {
        return $query->where('average_rating', '>=', $minRating);
    }

    // Authentication methods

    public function getAuthIdentifier()
    {
        return $this->getKey();
    }

    public function getAuthIdentifierName()
    {
        return 'id';
    }

    public function getAuthPassword()
    {
        return $this->password;
    }

    public function getRememberToken()
    {
        return $this->remember_token;
    }

    public function setRememberToken($value)
    {
        $this->remember_token = $value;
    }

    public function getRememberTokenName()
    {
        return 'remember_token';
    }
}
