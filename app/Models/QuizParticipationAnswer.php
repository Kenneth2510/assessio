<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizParticipationAnswer extends Model
{
    protected $fillable = [
        'quiz_participation_id',
        'quiz_question_id',
        'answer',
        'isCorrect',
    ];

    public function quizParticipation()
    {
        return $this->belongsTo(QuizParticipation::class);
    }

    public function question()
    {
        return $this->belongsTo(QuizQuestion::class, 'question_id');
    }
}
