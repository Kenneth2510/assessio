<?php

use App\Models\Quiz;
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
        Schema::create('quiz_participations', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class)->constrained()->onCascadeDelete();
            $table->foreignIdFor(Quiz::class)->constrained()->onCascadeDelete();
            $table->integer('total_score')->default(0);
            $table->integer('xp_earned')->default(0);
            $table->integer('time_taken')->default(0);
            $table->string('status')->default('completed');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_participations');
    }
};
