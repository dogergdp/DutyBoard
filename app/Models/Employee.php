<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['full_name', 'mobile', 'photo_path'];

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }
}
