<?php

namespace Database\Factories;

use App\Models\PriceList;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 20);
        $price    = fake()->numberBetween(5000, 100000);

        return [
            'id'            => 'T-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'type'          => fake()->randomElement(['penjualan', 'pengeluaran']),
            'date'          => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'price_list_id' => PriceList::factory(),
            'quantity'      => $quantity,
            'price'         => $price,
            'total'         => $quantity * $price,
            'note'          => fake()->optional()->sentence(),
            'user_id'       => User::factory(),
        ];
    }

    /** State: penjualan (sale) */
    public function sale(): static
    {
        return $this->state(['type' => 'penjualan']);
    }

    /** State: pengeluaran (expense/restock) */
    public function expense(): static
    {
        return $this->state(['type' => 'pengeluaran']);
    }

    /** State: today's transaction */
    public function today(): static
    {
        return $this->state(['date' => now()->toDateString()]);
    }
}
