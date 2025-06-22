<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'mode',
        'total_score',
        'total_time',
    ];

    protected $casts = [
        'total_score' => 'integer',
        'total_time' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function skillTags(): BelongsToMany
    {
        return $this->belongsToMany(SkillTags::class, 'quiz_tags', 'quiz_id', 'skill_tags_id');
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function quizParticipations(): HasMany
    {
        return $this->hasMany(QuizParticipation::class);
    }

    public function getTotalPossibleScoreAttribute()
    {
        return $this->questions()->sum('score') ?: $this->questions()->count();
    }
}
