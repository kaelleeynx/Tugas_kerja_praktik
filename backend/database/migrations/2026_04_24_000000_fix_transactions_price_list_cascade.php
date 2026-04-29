<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Change price_list_id foreign key from CASCADE to SET NULL.
     * Prevents accidental deletion of transaction history when a product is removed.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop existing foreign key constraint
            $table->dropForeign(['price_list_id']);

            // Re-add with SET NULL on delete to preserve transaction history
            $table->foreign('price_list_id')
                ->references('id')
                ->on('price_lists')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['price_list_id']);

            $table->foreign('price_list_id')
                ->references('id')
                ->on('price_lists')
                ->onDelete('cascade');
        });
    }
};
