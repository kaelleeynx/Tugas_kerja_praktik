<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The 'unit' column exists in price_lists but was never populated.
     * Make it nullable so existing rows with NULL are valid,
     * and add a default so new rows without unit don't fail.
     */
    public function up(): void
    {
        Schema::table('price_lists', function (Blueprint $table) {
            $table->string('unit')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('price_lists', function (Blueprint $table) {
            $table->string('unit')->nullable(false)->change();
        });
    }
};
