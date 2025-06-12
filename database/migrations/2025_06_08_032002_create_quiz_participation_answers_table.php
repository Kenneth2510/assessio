<?php

use App\Models\QuizParticipation;
use App\Models\QuizQuestion;
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
        Schema::create('quiz_participation_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(QuizParticipation::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(QuizQuestion::class)->constrained()->cascadeOnDelete();
            // Nullable for questions like identification or text answers
            $table->text('answer')->nullable();
            $table->tinyInteger('isCorrect')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_participation_answers');
    }
};
