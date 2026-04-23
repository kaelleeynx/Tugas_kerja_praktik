<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes to frequently queried columns for performance.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Composite index for date-range + type filtering (most common query)
            $table->index(['date', 'type'], 'idx_transactions_date_type');
            // Foreign key index for price_list join
            $table->index('price_list_id', 'idx_transactions_price_list_id');
            // Foreign key index for user join
            $table->index('user_id', 'idx_transactions_user_id');
        });

        Schema::table('users', function (Blueprint $table) {
            // Login lookup
            $table->index('username', 'idx_users_username');
            // Approval queries
            $table->index(['role', 'is_approved'], 'idx_users_role_approved');
        });

        Schema::table('notifications', function (Blueprint $table) {
            // User notification feed query
            $table->index(['user_id', 'read_at'], 'idx_notifications_user_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_date_type');
            $table->dropIndex('idx_transactions_price_list_id');
            $table->dropIndex('idx_transactions_user_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_username');
            $table->dropIndex('idx_users_role_approved');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_read');
        });
    }
};
