<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Transaction;
use App\Models\PriceList;

class EndToEndTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_application_flow()
    {
        // 1. Register as Staff (Auto-approved)
        $staffResponse = $this->postJson('/api/auth/register', [
            'username' => 'staff_test',
            'password' => 'password',
            'name' => 'Staff Test',
            'role' => 'staff'
        ]);
        $staffResponse->assertStatus(201)
            ->assertJsonPath('data.is_approved', true);

        // 2. Login as Staff
        $loginStaff = $this->postJson('/api/auth/login', [
            'username' => 'staff_test',
            'password' => 'password'
        ]);
        $loginStaff->assertStatus(200);
        $staffToken = $loginStaff->json('data.token');

        // 3. Register as Admin (Pending)
        $adminResponse = $this->postJson('/api/auth/register', [
            'username' => 'admin_test',
            'password' => 'password',
            'name' => 'Admin Test',
            'role' => 'admin'
        ]);
        $adminResponse->assertStatus(201)
            ->assertJsonPath('data.is_approved', false);

        // 4. Try Login as Admin (Should Fail)
        $loginAdminFail = $this->postJson('/api/auth/login', [
            'username' => 'admin_test',
            'password' => 'password'
        ]);
        $loginAdminFail->assertStatus(403);

        // 5. Owner Login (Seeded or Created)
        $owner = User::factory()->create([
            'username' => 'owner',
            'password' => bcrypt('owner123'),
            'role' => 'owner',
            'is_approved' => true
        ]);

        $loginOwner = $this->postJson('/api/auth/login', [
            'username' => 'owner',
            'password' => 'owner123'
        ]);
        $loginOwner->assertStatus(200);
        $ownerToken = $loginOwner->json('data.token');

        // 6. Owner Approves Admin
        $adminId = $adminResponse->json('data.id');
        $approveResponse = $this->postJson("/api/approvals/{$adminId}/approve", [], [
            'Authorization' => "Bearer $ownerToken"
        ]);
        $approveResponse->assertStatus(200);

        // 7. Login as Admin (Should Success now)
        $loginAdminSuccess = $this->postJson('/api/auth/login', [
            'username' => 'admin_test',
            'password' => 'password'
        ]);
        $loginAdminSuccess->assertStatus(200);
        $adminToken = $loginAdminSuccess->json('data.token');

        // 8. Create a price list item first, then create Transaction (as Staff)
        $txItem = PriceList::create([
            'product_id'   => 'TX001',
            'category'     => 'Besi',
            'product_name' => 'Test Product',
            'unit'         => 'pcs',
            'price'        => 10000,
            'stock'        => 50
        ]);

        $transactionResponse = $this->postJson('/api/transactions', [
            'type'          => 'penjualan',
            'date'          => '2023-01-01',
            'price_list_id' => $txItem->id,
            'quantity'      => 2,
            'price'         => 10000,
            'note'          => 'Test Note'
        ], ['Authorization' => "Bearer $staffToken"]);
        $transactionResponse->assertStatus(201);

        // 9. View Transactions (as Owner)
        $viewTrans = $this->getJson('/api/transactions', [
            'Authorization' => "Bearer $ownerToken"
        ]);
        $viewTrans->assertStatus(200);

        // 10. Price List Operations (as Admin)
        $item = PriceList::create([
            'product_id'   => 'P001',
            'category'     => 'Food',
            'product_name' => 'Test Item',
            'unit'         => 'pcs',
            'price'        => 5000,
            'stock'        => 10
        ]);

        // Sale
        $saleResponse = $this->postJson("/api/price-list/{$item->id}/sale", [
            'quantity' => 2
        ], ['Authorization' => "Bearer $adminToken"]);
        $saleResponse->assertStatus(200)
            ->assertJsonPath('data.stock', 8);

        // Restock
        $restockResponse = $this->postJson("/api/price-list/{$item->id}/restock", [
            'quantity' => 5
        ], ['Authorization' => "Bearer $adminToken"]);
        $restockResponse->assertStatus(200)
            ->assertJsonPath('data.stock', 13);
    }
}
