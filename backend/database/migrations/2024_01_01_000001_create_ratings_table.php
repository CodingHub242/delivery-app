<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // User who gave the rating
            $table->unsignedBigInteger('worker_id'); // Worker being rated
            $table->unsignedBigInteger('order_id')->nullable(); // Associated order
            $table->unsignedBigInteger('service_request_id')->nullable(); // Associated service request
            $table->tinyInteger('rating'); // Rating value (1-5)
            $table->text('review')->nullable(); // Optional review text
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('worker_id')->references('id')->on('workers')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('service_request_id')->references('id')->on('service_requests')->onDelete('set null');

            // Indexes for performance
            $table->index(['worker_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('rating');

            // Prevent duplicate ratings for same user-worker-order combination
            $table->unique(['user_id', 'worker_id', 'order_id'], 'unique_user_worker_order_rating');
            $table->unique(['user_id', 'worker_id', 'service_request_id'], 'unique_user_worker_service_rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
