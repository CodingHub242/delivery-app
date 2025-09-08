<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rating;
use App\Models\Worker;
use App\Models\User;
use App\Models\Order;

class RatingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some workers and users
        $workers = Worker::all();
        $users = User::where('role', 'customer')->get();
        $orders = Order::where('status', 'delivered')->get();

        if ($workers->isEmpty() || $users->isEmpty()) {
            $this->command->info('No workers or users found. Skipping rating seeder.');
            return;
        }

        // Sample reviews
        $sampleReviews = [
            'Excellent service! Very professional and punctual.',
            'Great driver, would definitely recommend.',
            'Fast delivery and very careful with packages.',
            'Good communication throughout the delivery.',
            'Worker was very helpful and friendly.',
            'Delivery was on time and everything was perfect.',
            'Professional service, will use again.',
            'Very satisfied with the service provided.',
            'Worker went above and beyond expectations.',
            'Reliable and trustworthy service.',
        ];

        // Create sample ratings
        foreach ($workers as $worker) {
            $ratingCount = rand(3, 15); // Each worker gets 3-15 ratings

            for ($i = 0; $i < $ratingCount; $i++) {
                $user = $users->random();
                $rating = rand(3, 5); // Ratings between 3-5 stars
                $order = $orders->where('worker_id', $worker->id)->random() ?? null;

                Rating::create([
                    'user_id' => $user->id,
                    'worker_id' => $worker->id,
                    'order_id' => $order?->id,
                    'rating' => $rating,
                    'review' => rand(0, 1) ? $sampleReviews[array_rand($sampleReviews)] : null,
                ]);
            }

            // Update worker's rating statistics
            $worker->updateRatingStats();
        }

        $this->command->info('Rating seeder completed successfully.');
    }
}
