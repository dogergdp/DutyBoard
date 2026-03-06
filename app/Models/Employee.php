<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Employee extends Authenticatable
{
    use Notifiable;

    protected $fillable = ['full_name', 'mobile', 'photo_path', 'password'];

    protected $hidden = ['password', 'remember_token'];

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }
}
