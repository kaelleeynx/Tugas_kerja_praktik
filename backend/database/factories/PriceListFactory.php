<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PriceList>
 */
class PriceListFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id'   => strtoupper(Str::random(8)),
            'product_name' => fake()->words(3, true),
            'category'     => fake()->randomElement(['Besi', 'Pipa', 'Cat', 'Semen', 'Kayu']),
            'unit'         => fake()->randomElement(['pcs', 'kg', 'meter', 'liter', 'roll']),
            'price'        => fake()->numberBetween(5000, 500000),
            'stock'        => fake()->numberBetween(10, 200),
        ];
    }

    /** State: item with low stock */
    public function lowStock(): static
    {
        return $this->state(['stock' => 2]);
    }

    /** State: item with zero stock */
    public function outOfStock(): static
    {
        return $this->state(['stock' => 0]);
    }
}
