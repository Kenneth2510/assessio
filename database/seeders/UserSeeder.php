<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super.admin@gmail.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        $learner = User::create([
            'name' => 'Learner',
            'email' => 'learner1@gmail.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        $instructor = User::create([
            'name' => 'Instructor',
            'email' => 'instructor1@gmail.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $learnerRole = Role::firstOrCreate([
            'name' => 'learner',
            'guard_name' => 'web',
        ]);

        $instructorRole = Role::firstOrCreate([
            'name' => 'instructor',
            'guard_name' => 'web',
        ]);

        $adminRole->givePermissionTo([
            'admin_dashboard.index',
            'users.index',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.index',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'quizzes.index',
            'quizzes.create',
            'quizzes.edit',
            'quizzes.delete',
            'quiz-questions.index',
            'quiz-questions.create',
            'quiz-questions.edit',
            'quiz-questions.delete',
            'quiz-results.index',
            'quiz-results.create',
            'quiz-results.edit',
            'quiz-results.delete',
        ]);

        $instructorRole->givePermissionTo([
            'instructor_dashboard.index',
            'quizzes.index',
            'quizzes.create',
            'quizzes.edit',
            'quizzes.delete',
            'quiz-questions.index',
            'quiz-questions.create',
            'quiz-questions.edit',
            'quiz-questions.delete',
        ]);

        $learnerRole->givePermissionTo([
            'learner_dashboard.index',
            'quiz-participation.index',
            'quiz-participation.create',
            'quiz-participation.edit',
            'quiz-participation.delete',
        ]);


        $admin->assignRole($adminRole);
        $learner->assignRole($learnerRole);
        $instructor->assignRole($instructorRole);
    }
}
