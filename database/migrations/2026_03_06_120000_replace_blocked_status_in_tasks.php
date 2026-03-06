<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('tasks')
            ->where('status', 'BLOCKED')
            ->update(['status' => 'REVIEW']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tasks')
            ->where('status', 'REVIEW')
            ->update(['status' => 'BLOCKED']);
    }
};
