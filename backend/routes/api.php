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
    Route::get('/auth/me', [AuthController::class, 'getCurrentUser']); // Get current authenticated user
    Route::put('/auth/me', [AuthController::class, 'updateProfile']); // Update own profile
    Route::post('/auth/me/password', [AuthController::class, 'changePassword']); // Change password

    // Users Management (read — all authenticated users)
    Route::get('/users', [UserController::class, 'index']); // List all users with pagination
    Route::get('/users/search', [UserController::class, 'search']); // Search users
    Route::get('/users/{id}', [UserController::class, 'show']); // Get user by ID

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']); // List with pagination & filtering
    Route::get('/transactions/statistics', [TransactionController::class, 'getStatistics']); // Get transaction statistics
    Route::get('/transactions/daily', [TransactionController::class, 'getDailyStatistics']); // Get daily statistics
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);
    Route::post('/transactions/export', [TransactionController::class, 'export']); // Export transactions

    // Price List Management
    Route::get('/price-list', [PriceListController::class, 'index']); // List with pagination
    Route::post('/price-list', [PriceListController::class, 'store']); // Create new price list item
    Route::get('/price-list/{id}', [PriceListController::class, 'show']);
    Route::put('/price-list/{id}', [PriceListController::class, 'update']);
    Route::delete('/price-list/{id}', [PriceListController::class, 'destroy']);
    Route::post('/price-list/{id}/sale', [PriceListController::class, 'sale']);
    Route::post('/price-list/{id}/restock', [PriceListController::class, 'restock']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'getNotifications']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);

    // Owner Only Routes
    Route::middleware('role:owner')->group(function () {
        // User Management (write — owner only)
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Approval Management
        Route::get('/approvals', [ApprovalController::class, 'index']); // List pending approvals
        Route::post('/approvals/{id}/approve', [ApprovalController::class, 'approve']);
        Route::post('/approvals/{id}/reject', [ApprovalController::class, 'reject']); // Changed from DELETE

        // Dashboard Statistics
        Route::get('/dashboard/summary', [TransactionController::class, 'dashboardSummary']);
        Route::get('/dashboard/monthly-report', [TransactionController::class, 'monthlyReport']);
    });
});
