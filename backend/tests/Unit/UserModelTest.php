<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Transaction;
use App\Models\PriceList;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Unit tests for User model — attributes, casts, relationships, factory states.
 */
class UserModelTest extends TestCase
{
    use RefreshDatabase;

    // ─── Fillable & Hidden ────────────────────────────────────────────────

    /** @test */
    public function it_hides_password_and_remember_token_from_serialization(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret')]);
        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
    }

    /** @test */
    public function it_casts_is_approved_to_boolean(): void
    {
        $user = User::factory()->create(['is_approved' => 1]);

        $this->assertIsBool($user->is_approved);
        $this->assertTrue($user->is_approved);
    }

    /** @test */
    public function it_casts_last_login_at_to_datetime(): void
    {
        $user = User::factory()->create(['last_login_at' => '2024-01-15 10:00:00']);

        $this->assertInstanceOf(\Carbon\Carbon::class, $user->last_login_at);
    }

    // ─── Factory States ───────────────────────────────────────────────────

    /** @test */
    public function owner_factory_state_creates_approved_owner(): void
    {
        $owner = User::factory()->owner()->create();

        $this->assertEquals('owner', $owner->role);
        $this->assertTrue($owner->is_approved);
    }

    /** @test */
    public function admin_factory_state_creates_approved_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertEquals('admin', $admin->role);
        $this->assertTrue($admin->is_approved);
    }

    /** @test */
    public function pending_admin_factory_state_creates_unapproved_admin(): void
    {
        $pending = User::factory()->pendingAdmin()->create();

        $this->assertEquals('admin', $pending->role);
        $this->assertFalse($pending->is_approved);
    }

    /** @test */
    public function staff_factory_state_creates_approved_staff(): void
    {
        $staff = User::factory()->staff()->create();

        $this->assertEquals('staff', $staff->role);
        $this->assertTrue($staff->is_approved);
    }

    // ─── Relationships ────────────────────────────────────────────────────

    /** @test */
    public function it_has_many_transactions(): void
    {
        $user = User::factory()->staff()->create();
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->count(3)->create([
            'user_id'       => $user->id,
            'price_list_id' => $item->id,
        ]);

        $this->assertCount(3, $user->transactions);
        $this->assertInstanceOf(Transaction::class, $user->transactions->first());
    }

    /** @test */
    public function it_returns_empty_collection_when_user_has_no_transactions(): void
    {
        $user = User::factory()->staff()->create();

        $this->assertCount(0, $user->transactions);
    }

    // ─── Business Rules ───────────────────────────────────────────────────

    /** @test */
    public function staff_is_auto_approved_by_default(): void
    {
        $staff = User::factory()->staff()->create();

        $this->assertTrue($staff->is_approved);
    }

    /** @test */
    public function admin_is_not_approved_by_default_via_pending_state(): void
    {
        $pending = User::factory()->pendingAdmin()->create();

        $this->assertFalse($pending->is_approved);
    }
}
