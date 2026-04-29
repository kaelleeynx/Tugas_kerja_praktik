<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Feature tests for Auth endpoints:
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── Register ─────────────────────────────────────────────────────────

    /** @test */
    public function staff_can_register_and_is_auto_approved(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'username' => 'staff_baru',
            'password' => 'password123',
            'name'     => 'Staff Baru',
            'role'     => 'staff',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_approved', true)
            ->assertJsonPath('data.role', 'staff');

        $this->assertDatabaseHas('users', [
            'username'    => 'staff_baru',
            'role'        => 'staff',
            'is_approved' => true,
        ]);
    }

    /** @test */
    public function admin_can_register_but_is_not_auto_approved(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'username' => 'admin_baru',
            'password' => 'password123',
            'name'     => 'Admin Baru',
            'role'     => 'admin',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_approved', false)
            ->assertJsonPath('data.role', 'admin');

        $this->assertDatabaseHas('users', [
            'username'    => 'admin_baru',
            'is_approved' => false,
        ]);
    }

    /** @test */
    public function register_fails_with_duplicate_username(): void
    {
        User::factory()->create(['username' => 'existing_user']);

        $response = $this->postJson('/api/auth/register', [
            'username' => 'existing_user',
            'password' => 'password123',
            'name'     => 'Another User',
            'role'     => 'staff',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function register_fails_with_missing_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username', 'password', 'name']);
    }

    // ─── Login ────────────────────────────────────────────────────────────

    /** @test */
    public function approved_user_can_login_and_receives_token(): void
    {
        $user = User::factory()->staff()->create([
            'username' => 'staff_login',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'staff_login',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['token', 'user'],
            ]);
    }

    /** @test */
    public function unapproved_admin_cannot_login(): void
    {
        User::factory()->pendingAdmin()->create([
            'username' => 'pending_admin',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'pending_admin',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function login_fails_with_wrong_password(): void
    {
        User::factory()->staff()->create([
            'username' => 'staff_test',
            'password' => Hash::make('correct_password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'staff_test',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function login_fails_with_nonexistent_username(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'username' => 'ghost_user',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function login_updates_last_login_at_timestamp(): void
    {
        $user = User::factory()->staff()->create([
            'username'      => 'staff_ts',
            'password'      => Hash::make('password123'),
            'last_login_at' => null,
        ]);

        $this->postJson('/api/auth/login', [
            'username' => 'staff_ts',
            'password' => 'password123',
        ]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    // ─── Logout ───────────────────────────────────────────────────────────

    /** @test */
    public function authenticated_user_can_logout(): void
    {
        $user = User::factory()->staff()->create();

        // Create a real token so currentAccessToken() works
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /** @test */
    public function unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    // ─── Get Current User ─────────────────────────────────────────────────

    /** @test */
    public function authenticated_user_can_get_their_profile(): void
    {
        $user = User::factory()->staff()->create(['name' => 'Zandi Test']);

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Zandi Test');
    }

    /** @test */
    public function unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    // ─── Change Password ──────────────────────────────────────────────────

    /** @test */
    public function user_can_change_password_with_correct_current_password(): void
    {
        $user = User::factory()->staff()->create([
            'password' => Hash::make('old_password'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/me/password', [
            'current_password'      => 'old_password',
            'password'              => 'new_password123',
            'password_confirmation' => 'new_password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('new_password123', $user->fresh()->password));
    }

    /** @test */
    public function user_cannot_change_password_with_wrong_current_password(): void
    {
        $user = User::factory()->staff()->create([
            'password' => Hash::make('correct_password'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/me/password', [
            'current_password'      => 'wrong_password',
            'password'              => 'new_password123',
            'password_confirmation' => 'new_password123',
        ]);

        $response->assertStatus(422);
    }
}
