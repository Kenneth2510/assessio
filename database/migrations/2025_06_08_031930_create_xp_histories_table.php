<?php

use App\Models\User;
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
        Schema::create('xp_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class)->constrained()->onCascadeDelete();
            $table->string('source');
            $table->integer('source_id');
            $table->integer('xp_earned')->default(0);
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('xp_histories');
    }
};
