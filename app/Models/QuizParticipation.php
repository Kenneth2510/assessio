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
}
