<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard
            'learner_dashboard.index',
            'instructor_dashboard.index',
            'admin_dashboard.index',

            // User and Role Management
            'users.index',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.index',
            'roles.create',
            'roles.edit',
            'roles.delete',

            // Quiz
            'quizzes.index',
            'quizzes.create',
            'quizzes.edit',
            'quizzes.delete',

            // Quiz Questions
            'quiz-questions.index',
            'quiz-questions.create',
            'quiz-questions.edit',
            'quiz-questions.delete',

            // Quiz Results
            'quiz-results.index',
            'quiz-results.create',
            'quiz-results.edit',
            'quiz-results.delete',

            // Quiz Participation
            'quiz-participation.index',
            'quiz-participation.create',
            'quiz-participation.edit',
            'quiz-participation.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
