<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Approval endpoints:
 * GET  /api/approvals
 * POST /api/approvals/{id}/approve
 * POST /api/approvals/{id}/reject
 */
class ApprovalTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->owner()->create();
    }

    // ─── GET /api/approvals ───────────────────────────────────────────────

    /** @test */
    public function owner_can_list_pending_approvals(): void
    {
        User::factory()->pendingAdmin()->count(3)->create();
        User::factory()->admin()->create(); // approved — should not appear

        $response = $this->actingAs($this->owner)->getJson('/api/approvals');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function pending_list_excludes_approved_admins(): void
    {
        User::factory()->admin()->create(['is_approved' => true]);

        $response = $this->actingAs($this->owner)->getJson('/api/approvals');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    /** @test */
    public function unauthenticated_user_cannot_list_approvals(): void
    {
        $response = $this->getJson('/api/approvals');

        $response->assertStatus(401);
    }

    // ─── POST /api/approvals/{id}/approve ────────────────────────────────

    /** @test */
    public function owner_can_approve_pending_admin(): void
    {
        $pending = User::factory()->pendingAdmin()->create();

        $response = $this->actingAs($this->owner)->postJson("/api/approvals/{$pending->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_approved', true);

        $this->assertTrue($pending->fresh()->is_approved);
    }

    /** @test */
    public function approving_already_approved_user_returns_error(): void
    {
        $approved = User::factory()->admin()->create(['is_approved' => true]);

        $response = $this->actingAs($this->owner)->postJson("/api/approvals/{$approved->id}/approve");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function cannot_approve_non_admin_user(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($this->owner)->postJson("/api/approvals/{$staff->id}/approve");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function approving_creates_notification_for_the_user(): void
    {
        $pending = User::factory()->pendingAdmin()->create();

        $this->actingAs($this->owner)->postJson("/api/approvals/{$pending->id}/approve");

        $this->assertDatabaseHas('notifications', [
            'user_id' => $pending->id,
            'type'    => 'system',
            'title'   => 'Akun Disetujui',
        ]);
    }

    // ─── POST /api/approvals/{id}/reject ─────────────────────────────────

    /** @test */
    public function owner_can_reject_and_delete_pending_admin(): void
    {
        $pending = User::factory()->pendingAdmin()->create();

        $response = $this->actingAs($this->owner)->postJson("/api/approvals/{$pending->id}/reject");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('users', ['id' => $pending->id]);
    }

    /** @test */
    public function cannot_reject_non_admin_user(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($this->owner)->postJson("/api/approvals/{$staff->id}/reject");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('users', ['id' => $staff->id]);
    }

    /** @test */
    public function rejecting_nonexistent_user_returns_404(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/approvals/99999/reject');

        $response->assertStatus(404);
    }
}
