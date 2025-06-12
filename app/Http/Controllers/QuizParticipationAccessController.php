<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizParticipation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class QuizParticipationAccessController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $userId = Auth::id();

        // Fetch quizzes that have been taken by the current user
        $quizzesTaken = Cache::remember("quiz_participation_access_user_{$userId}", 600, function () use ($userId) {
            return QuizParticipation::with('quiz')
                ->where('user_id', $userId)
                ->get()
                ->map(function ($access) {
                    return [
                        'id' => $access->id,
                        'quiz_id' => $access->quiz_id,
                        'quiz_name' => $access->quiz->title,
                        'created_at' => $access->created_at,
                        'updated_at' => $access->updated_at,
                    ];
                });
        });

        // Extract taken quiz IDs
        $takenQuizIds = $quizzesTaken->pluck('quiz_id');

        // Fetch quizzes not yet taken
        $availableQuizzes = Cache::remember("quizzes_available_user_{$userId}", 600, function () use ($takenQuizIds) {
            return Quiz::whereNotIn('id', $takenQuizIds)
                ->get()
                ->map(function ($quiz) {
                    return [
                        'quiz_id' => $quiz->id,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                        'mode' => $quiz->mode,
                        'total_score' => $quiz->total_score,
                        'total_time' => $quiz->total_time,
                        'created_at' => $quiz->created_at,
                        'updated_at' => $quiz->updated_at,
                    ];
                });
        });

        return Inertia::render('quiz-participation-access/index', [
            'quizzes_taken' => $quizzesTaken,
            'quizzes_available' => $availableQuizzes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Quiz $quiz_access) {}

    /**
     * Display the specified resource.
     */
    public function show(Quiz $quiz_access)
    {
        $quiz = Quiz::with('creator')->findOrFail($quiz_access->id);

        $userId = Auth::id();

        $attempt = QuizParticipation::where('user_id', $userId)
            ->where('quiz_id', $quiz->id)
            ->first();

        return Inertia::render('quiz-participation-access/actions/view', [
            'quiz' => $quiz,
            'hasTaken' => (bool) $attempt,
            'attemptId' => $attempt?->id,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
