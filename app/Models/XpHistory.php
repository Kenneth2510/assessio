<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class XpHistory extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'source_id',
        'xp_earned',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getSourceAttribute($value)
    {
        return ucfirst($value);
    }
}
