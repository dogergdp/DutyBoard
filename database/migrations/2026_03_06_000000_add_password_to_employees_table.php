<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'password')) {
                $table->string('password')->nullable()->after('photo_path');
            }

            if (! Schema::hasColumn('employees', 'remember_token')) {
                $table->rememberToken();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'password')) {
                $table->dropColumn('password');
            }

            if (Schema::hasColumn('employees', 'remember_token')) {
                $table->dropColumn('remember_token');
            }
        });
    }
};
