<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizQuestion extends Model
{
    protected $fillable = [
        'quiz_id',
        'question_type',
        'question',
        'score',
        'time',
        'isRequired',
    ];

    protected $casts = [
        'score' => 'integer',
        'time' => 'integer',
        'isRequired' => 'boolean',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function choices()
    {
        return $this->hasMany(QuizQuestionChoices::class);
    }

    public function participationAnswers(): HasMany
    {
        return $this->hasMany(QuizParticipationAnswer::class);
    }
}
