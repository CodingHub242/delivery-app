<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'category',
        'base_price',
        'price_per_km',
        'is_active',
        'estimated_duration',
        'image_url',
        'requirements',
        'available_24_7'
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'price_per_km' => 'decimal:2',
        'is_active' => 'boolean',
        'available_24_7' => 'boolean',
        'requirements' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the service requests for this service
     */
    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class);
    }

    /**
     * Scope for active services
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for services by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Check if service is available 24/7
     */
    public function isAvailable247(): bool
    {
        return $this->available_24_7;
    }

    /**
     * Calculate price for distance
     */
    public function calculatePrice(float $distance): float
    {
        return $this->base_price + ($this->price_per_km * $distance);
    }
}
