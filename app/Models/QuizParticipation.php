<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizParticipation extends Model
{
    protected $fillable = [
        'user_id',
        'quiz_id',
        'total_score',
        'xp_earned',
        'time_taken',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function answers()
    {
        return $this->hasMany(QuizParticipationAnswer::class);
    }

    public function getPercentageAttribute()
    {
        if (!$this->quiz) {
            return 0;
        }

        $totalPossibleScore = $this->quiz->questions->sum(function ($question) {
            return $question->score ?? 1;
        });

        return $totalPossibleScore > 0 ?
            round(($this->total_score / $totalPossibleScore) * 100, 1) : 0;
    }

    // Helper method to get correct answers count
    public function getCorrectAnswersCountAttribute()
    {
        return $this->answers()->where('isCorrect', 1)->count();
    }
}
