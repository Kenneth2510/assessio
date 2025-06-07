<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public function creator() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function skillTags() {
        return $this->belongsToMany(SkillTags::class, 'quiz_tags');
    }
}
