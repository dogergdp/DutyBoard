<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = ['title', 'description', 'assigned_to', 'status', 'priority', 'due_at'];

    protected $casts = [
        'due_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }
}
