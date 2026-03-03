<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_employee()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('employees.store'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('employees', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);
    }

    public function test_can_assign_task_to_employee()
    {
        $user = User::factory()->create();
        $employee = Employee::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);

        $response = $this->actingAs($user)->post(route('tasks.store'), [
            'employee_id' => $employee->id,
            'name' => 'Test Task',
            'description' => 'Test Description',
            'deadline' => '2026-12-31',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'employee_id' => $employee->id,
            'name' => 'Test Task',
            'description' => 'Test Description',
            'deadline' => '2026-12-31',
        ]);
    }

    public function test_employees_page_returns_data()
    {
        $user = User::factory()->create();
        $employee = Employee::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
        $employee->tasks()->create([
            'name' => 'Test Task',
            'description' => 'Test Description',
            'deadline' => '2026-12-31',
        ]);

        $response = $this->actingAs($user)->get(route('employees.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/index')
            ->has('employees', 1)
            ->where('employees.0.name', 'Jane Doe')
            ->has('employees.0.tasks', 1)
        );
    }
}
