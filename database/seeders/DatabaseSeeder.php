<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an admin user
        \App\Models\User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $employees = [
            ['full_name' => 'John Doe', 'mobile' => '1234567890', 'photo_path' => 'https://i.pravatar.cc/150?u=john'],
            ['full_name' => 'Jane Smith', 'mobile' => '0987654321', 'photo_path' => 'https://i.pravatar.cc/150?u=jane'],
            ['full_name' => 'Alice Johnson', 'mobile' => '1122334455', 'photo_path' => 'https://i.pravatar.cc/150?u=alice'],
            ['full_name' => 'Bob Brown', 'mobile' => '5544332211', 'photo_path' => 'https://i.pravatar.cc/150?u=bob'],
        ];

        foreach ($employees as $empData) {
            $employee = \App\Models\Employee::create($empData);

            // Create some tasks for each employee
            \App\Models\Task::create([
                'title' => 'Initial Task for ' . $employee->full_name,
                'description' => 'This is the first task assigned to ' . $employee->full_name,
                'assigned_to' => $employee->id,
                'status' => 'ASSIGNED',
                'priority' => 'LOW',
                'due_at' => now()->addDays(2),
            ]);

            \App\Models\Task::create([
                'title' => 'Urgent Review for ' . $employee->full_name,
                'description' => 'Please review this immediately.',
                'assigned_to' => $employee->id,
                'status' => 'REVIEW',
                'priority' => 'URGENT',
                'due_at' => now()->subHours(5), // Overdue
            ]);

            \App\Models\Task::create([
                'title' => 'InProgress Work for ' . $employee->full_name,
                'description' => 'Currently working on this.',
                'assigned_to' => $employee->id,
                'status' => 'IN_PROGRESS',
                'priority' => 'MED',
                'due_at' => now()->addHours(10),
            ]);
        }
    }
}
