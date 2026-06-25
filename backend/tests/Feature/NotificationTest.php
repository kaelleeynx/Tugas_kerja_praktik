<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->staff()->create();
        $this->otherUser = User::factory()->staff()->create();
    }

    /** @test */
    public function authenticated_user_can_list_notifications(): void
    {
        // Create notifications for our user
        Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 1',
            'message' => 'Pesan 1',
        ]);

        Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 2',
            'message' => 'Pesan 2',
            'read_at' => now(),
        ]);

        // Create notification for other user
        Notification::create([
            'user_id' => $this->otherUser->id,
            'type' => 'system',
            'title' => 'Other Notif',
            'message' => 'Other Pesan',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('unread_count', 1);
    }

    /** @test */
    public function user_can_get_unread_count(): void
    {
        Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 1',
            'message' => 'Pesan 1',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('unread_count', 1);
    }

    /** @test */
    public function user_can_mark_notification_as_read(): void
    {
        $notification = Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 1',
            'message' => 'Pesan 1',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    /** @test */
    public function user_cannot_mark_other_users_notification_as_read(): void
    {
        $notification = Notification::create([
            'user_id' => $this->otherUser->id,
            'type' => 'system',
            'title' => 'Other Notif',
            'message' => 'Other Pesan',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(404);
    }

    /** @test */
    public function user_can_mark_all_notifications_as_read(): void
    {
        Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 1',
            'message' => 'Pesan 1',
        ]);

        Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 2',
            'message' => 'Pesan 2',
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/notifications/mark-all-read');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(0, Notification::where('user_id', $this->user->id)->whereNull('read_at')->count());
    }

    /** @test */
    public function user_can_delete_notification(): void
    {
        $notification = Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'title' => 'Notif 1',
            'message' => 'Pesan 1',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    /** @test */
    public function user_cannot_delete_other_users_notification(): void
    {
        $notification = Notification::create([
            'user_id' => $this->otherUser->id,
            'type' => 'system',
            'title' => 'Other Notif',
            'message' => 'Other Pesan',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(404);
    }
}
