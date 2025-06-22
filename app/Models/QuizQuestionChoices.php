<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestionChoices extends Model
{
    protected $fillable = [
        'quiz_question_id',
        'choice',
        'isCorrect'
    ];


    public function question()
    {
        return $this->belongsTo(QuizQuestion::class, 'quiz_question_id');
    }
}
