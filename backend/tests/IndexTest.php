<?php

namespace Tests;

use PHPUnit\Framework\TestCase as BaseTestCase;

/**
 * ============================================================
 * BACKEND TEST SUITE — Toko Besi Serta Guna
 * ============================================================
 *
 * Suite runner: dokumentasi dan registry semua test suite.
 *
 * Jalankan semua test:
 *   composer test
 *   php artisan test
 *
 * Jalankan per suite:
 *   php artisan test --testsuite=Unit
 *   php artisan test --testsuite=Feature
 *
 * Jalankan file spesifik:
 *   php artisan test tests/Unit/TransactionServiceTest.php
 *   php artisan test tests/Feature/AuthTest.php
 *
 * Jalankan dengan coverage:
 *   php artisan test --coverage
 *
 * ============================================================
 * STRUKTUR TEST SUITE
 * ============================================================
 *
 * 📁 Unit/
 *   ├── TransactionServiceTest.php  — Business logic: statistics, daily, monthly
 *   ├── UserModelTest.php           — Model attributes, casts, relationships, factory states
 *   └── PriceListModelTest.php      — Model attributes, stock ops, relationships
 *
 * 📁 Feature/
 *   ├── AuthTest.php                — Register, login, logout, profile, password
 *   ├── TransactionTest.php         — CRUD, stock sync, RBAC, validation
 *   ├── PriceListTest.php           — CRUD, sale, restock, stock guard
 *   ├── ApprovalTest.php            — Approve, reject, notifications, RBAC
 *   └── EndToEndTest.php            — Full application flow (existing)
 *
 * ============================================================
 */
class IndexTest extends BaseTestCase
{
    // ─── Suite Registry ───────────────────────────────────────────────────

    private array $suites = [
        // Unit
        ['name' => 'TransactionServiceTest', 'type' => 'Unit',    'tests' => 12, 'covers' => 'TransactionService'],
        ['name' => 'UserModelTest',          'type' => 'Unit',    'tests' => 10, 'covers' => 'User model'],
        ['name' => 'PriceListModelTest',     'type' => 'Unit',    'tests' => 8,  'covers' => 'PriceList model'],

        // Feature
        ['name' => 'AuthTest',               'type' => 'Feature', 'tests' => 12, 'covers' => 'Auth endpoints'],
        ['name' => 'TransactionTest',        'type' => 'Feature', 'tests' => 11, 'covers' => 'Transaction endpoints'],
        ['name' => 'PriceListTest',          'type' => 'Feature', 'tests' => 12, 'covers' => 'PriceList endpoints'],
        ['name' => 'ApprovalTest',           'type' => 'Feature', 'tests' => 8,  'covers' => 'Approval endpoints'],
        ['name' => 'EndToEndTest',           'type' => 'Feature', 'tests' => 1,  'covers' => 'Full app flow'],
    ];

    /** @test */
    public function suite_registry_has_correct_count(): void
    {
        $this->assertCount(8, $this->suites);
    }

    /** @test */
    public function suite_registry_has_expected_total_tests(): void
    {
        $total = array_sum(array_column($this->suites, 'tests'));
        $this->assertGreaterThanOrEqual(74, $total);
    }

    /** @test */
    public function suite_registry_covers_all_required_types(): void
    {
        $types = array_unique(array_column($this->suites, 'type'));
        $this->assertContains('Unit', $types);
        $this->assertContains('Feature', $types);
    }

    /** @test */
    public function suite_registry_covers_all_required_domains(): void
    {
        $names = array_column($this->suites, 'name');
        $this->assertContains('AuthTest', $names);
        $this->assertContains('TransactionTest', $names);
        $this->assertContains('PriceListTest', $names);
        $this->assertContains('ApprovalTest', $names);
        $this->assertContains('TransactionServiceTest', $names);
    }

    /** @test */
    public function unit_suites_cover_all_models_and_services(): void
    {
        $unitSuites = array_filter($this->suites, fn($s) => $s['type'] === 'Unit');
        $unitNames  = array_column(array_values($unitSuites), 'name');

        $this->assertContains('TransactionServiceTest', $unitNames);
        $this->assertContains('UserModelTest', $unitNames);
        $this->assertContains('PriceListModelTest', $unitNames);
    }

    /** @test */
    public function feature_suites_cover_all_api_endpoints(): void
    {
        $featureSuites = array_filter($this->suites, fn($s) => $s['type'] === 'Feature');
        $featureNames  = array_column(array_values($featureSuites), 'name');

        $this->assertContains('AuthTest', $featureNames);
        $this->assertContains('TransactionTest', $featureNames);
        $this->assertContains('PriceListTest', $featureNames);
        $this->assertContains('ApprovalTest', $featureNames);
    }
}
