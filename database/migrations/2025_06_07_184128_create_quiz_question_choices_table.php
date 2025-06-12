<?php

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
        Schema::create('quiz_question_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(QuizQuestion::class)->constrained()->cascadeOnDelete();
            $table->string('choice');
            $table->tinyInteger('isCorrect')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_question_choices');
    }
};
