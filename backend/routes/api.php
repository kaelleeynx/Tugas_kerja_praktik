<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PriceListController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\NotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Version: v1
|
| IMPORTANT: Specific/named routes MUST be declared BEFORE parameterized
| routes (e.g. /transactions/statistics before /transactions/{id})
| to prevent Laravel from matching the named segment as an {id} parameter.
*/

// Public routes with rate limiting
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/register', [AuthController::class, 'register']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Endpoints
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'getCurrentUser']);
    Route::put('/auth/me', [AuthController::class, 'updateProfile']);
    Route::post('/auth/me/password', [AuthController::class, 'changePassword']);

    // Users Management — FIX S2/S3: pindah ke owner-only group di bawah
    // GET /users, /users/search, /users/{id} sekarang dilindungi role:owner

    // Transactions — FIX A1: specific routes BEFORE /{id}
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/statistics', [TransactionController::class, 'getStatistics']);   // was after {id}
    Route::get('/transactions/daily', [TransactionController::class, 'getDailyStatistics']);   // was after {id}
    Route::get('/transactions/export', [TransactionController::class, 'export']);              // FIX A2: GET not POST
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

    // Price List Management
    Route::get('/price-list', [PriceListController::class, 'index']);
    Route::post('/price-list', [PriceListController::class, 'store']);
    Route::get('/price-list/{id}', [PriceListController::class, 'show']);
    Route::put('/price-list/{id}', [PriceListController::class, 'update']);
    Route::delete('/price-list/{id}', [PriceListController::class, 'destroy']);
    Route::post('/price-list/{id}/sale', [PriceListController::class, 'sale']);
    Route::post('/price-list/{id}/restock', [PriceListController::class, 'restock']);

    // Notifications — specific routes BEFORE /{id}
    Route::get('/notifications', [NotificationController::class, 'getNotifications']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']); // was after /{id}
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);

    // Owner Only Routes
    Route::middleware('role:owner')->group(function () {
        // User Management — FIX S2/S3: semua user endpoints dilindungi role:owner
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/search', [UserController::class, 'search']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Approval Management
        Route::get('/approvals', [ApprovalController::class, 'index']);
        Route::post('/approvals/{id}/approve', [ApprovalController::class, 'approve']);
        Route::post('/approvals/{id}/reject', [ApprovalController::class, 'reject']);

        // Dashboard Statistics
        Route::get('/dashboard/summary', [TransactionController::class, 'dashboardSummary']);
        Route::get('/dashboard/monthly-report', [TransactionController::class, 'monthlyReport']);
    });
});
