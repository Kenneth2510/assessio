<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\LearnerController;
use App\Http\Controllers\QuizController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'dashboard'])
        ->name('dashboard');

    Route::get('admin/dashboard', [DashboardController::class, 'admin'])
        ->name('admin.dashboard');

    Route::get('instructor/dashboard', [DashboardController::class, 'instructor'])
        ->name('instructor.dashboard');

    Route::get('learner/dashboard', [DashboardController::class, 'learner'])
        ->name('learner.dashboard');
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::resource('user-management/admin', AdminController::class);
    Route::resource('user-management/learner', LearnerController::class);
    Route::resource('user-management/instructor', InstructorController::class);
});

Route::middleware(['auth', 'verified', 'role:admin|instructor'])->group(function () {
    Route::resource('quiz-management', QuizController::class);
});




require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
