<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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


    public function quiz () {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function choices () {
        return $this->hasMany(QuizQuestionChoices::class);
    }
}
