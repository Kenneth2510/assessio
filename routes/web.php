<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\LearnerController;
use App\Http\Controllers\QuizAnalyticsController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizParticipationAccessController;
use App\Http\Controllers\QuizParticipationController;
use App\Http\Controllers\QuizQuestionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [AuthenticatedSessionController::class, 'create'])
    ->name('home');


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
    Route::resource('quiz-question-management', QuizQuestionController::class);

    // Routes you'd add to web.php
    Route::get('/quiz/{quiz}/analytics', [QuizAnalyticsController::class, 'show'])->name('quiz.analytics');
    Route::get('/quiz/{quiz}/analytics/{quiz_participation}', [QuizAnalyticsController::class, 'showResults'])->name('quiz.analytics-participation');


    // Route::get('/quiz/{quiz}/analytics/realtime', [QuizAnalyticsController::class, 'realtime']);
    // Route::get('/quiz/{quiz}/analytics/export', [QuizAnalyticsController::class, 'export']);
    // Route::post('/quiz/analytics/compare', [QuizAnalyticsController::class, 'compare']);
    // Route::delete('/quiz/{quiz}/analytics/cache', [QuizAnalyticsController::class, 'clearCache']);
});

Route::middleware(['auth', 'verified', 'role:learner'])->group(function () {
    Route::resource('quiz-access', QuizParticipationAccessController::class)->only(['index', 'show']);
    Route::resource('quiz-participation', QuizParticipationController::class);

    Route::get('/quiz-results/{participationId}', [QuizParticipationController::class, 'showResults'])
        ->name('quiz-results.show');

    Route::get('/my-quiz-results', [QuizParticipationController::class, 'userResults'])
        ->name('quiz-results.index');
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
