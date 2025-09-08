<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'worker_id',
        'tracking_id',
        'pickup_location',
        'delivery_location',
        'pickup_latitude',
        'pickup_longitude',
        'delivery_latitude',
        'delivery_longitude',
        'distance',
        'estimated_cost',
        'actual_cost',
        'status',
        'scheduled_time',
        'delivered_at',
        'notes',
        'package_description',
        'recipient_name',
        'recipient_phone',
        'payment_method',
        'payment_status'
    ];

    protected $casts = [
        'pickup_latitude' => 'decimal:8',
        'pickup_longitude' => 'decimal:8',
        'delivery_latitude' => 'decimal:8',
        'delivery_longitude' => 'decimal:8',
        'distance' => 'decimal:2',
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'scheduled_time' => 'datetime',
        'delivered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_PICKED_UP = 'picked_up';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_OUT_FOR_DELIVERY = 'out_for_delivery';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    // Payment status constants
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_COMPLETED = 'completed';
    const PAYMENT_FAILED = 'failed';
    const PAYMENT_REFUNDED = 'refunded';

    /**
     * Get the user that owns the order
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the worker assigned to this order
     */
    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }

    /**
     * Get the ratings for this order
     */
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for filtering by worker
     */
    public function scopeByWorker($query, $workerId)
    {
        return $query->where('worker_id', $workerId);
    }

    /**
     * Check if the order is active
     */
    public function isActive(): bool
    {
        return in_array($this->status, [
            self::STATUS_ACCEPTED,
            self::STATUS_PICKED_UP,
            self::STATUS_IN_TRANSIT,
            self::STATUS_OUT_FOR_DELIVERY
        ]);
    }

    /**
     * Check if the order is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    /**
     * Check if the order is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColor(): string
    {
        return match($this->status) {
            self::STATUS_DELIVERED => 'success',
            self::STATUS_CANCELLED => 'danger',
            self::STATUS_PENDING => 'warning',
            self::STATUS_ACCEPTED, self::STATUS_PICKED_UP, self::STATUS_IN_TRANSIT, self::STATUS_OUT_FOR_DELIVERY => 'primary',
            default => 'medium'
        };
    }

    /**
     * Get payment status badge color
     */
    public function getPaymentStatusBadgeColor(): string
    {
        return match($this->payment_status) {
            self::PAYMENT_COMPLETED => 'success',
            self::PAYMENT_FAILED => 'danger',
            self::PAYMENT_REFUNDED => 'warning',
            self::PAYMENT_PENDING => 'primary',
            default => 'medium'
        };
    }
}
