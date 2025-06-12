<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SkillTags extends Model
{
    protected $fillable = [
        'tag_title',
        'description',
    ];

    public function quizzes(): BelongsToMany
    {
        return $this->belongsToMany(Quiz::class, 'quiz_tags', 'skill_tags_id', 'quiz_id');
    }
}
