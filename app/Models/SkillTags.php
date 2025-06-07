<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkillTags extends Model
{
    protected $fillable = [
        'tag_title',
        'description',
    ];

    public function quizzes() {
        return $this->belongsToMany(Quiz::class, 'quiz_tags');
    }
}
