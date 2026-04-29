<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name'         => fake()->name(),
            'username'     => fake()->unique()->userName(),
            'password'     => static::$password ??= Hash::make('password'),
            'role'         => 'staff',
            'is_approved'  => true,
            'remember_token' => Str::random(10),
        ];
    }

    /** State: owner role */
    public function owner(): static
    {
        return $this->state(['role' => 'owner', 'is_approved' => true]);
    }

    /** State: admin role, approved */
    public function admin(): static
    {
        return $this->state(['role' => 'admin', 'is_approved' => true]);
    }

    /** State: admin role, pending approval */
    public function pendingAdmin(): static
    {
        return $this->state(['role' => 'admin', 'is_approved' => false]);
    }

    /** State: staff role (auto-approved) */
    public function staff(): static
    {
        return $this->state(['role' => 'staff', 'is_approved' => true]);
    }
}
