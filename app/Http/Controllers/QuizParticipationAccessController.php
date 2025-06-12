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

        // Fetch quizzes that have been taken by the current user with enhanced data
        $quizzesTaken = Cache::remember("quiz_participation_access_user_{$userId}", 600, function () use ($userId) {
            return QuizParticipation::with(['quiz', 'quiz.questions'])
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($participation) {
                    // Calculate total possible score
                    $totalPossibleScore = $participation->quiz->questions->sum(function($question) {
                        return $question->score ?? 1;
                    });

                    // Calculate percentage
                    $percentage = $totalPossibleScore > 0 ?
                        round(($participation->total_score / $totalPossibleScore) * 100, 1) : 0;

                    // Calculate correct answers count
                    $correctAnswers = $participation->answers()->where('isCorrect', 1)->count();
                    $totalQuestions = $participation->quiz->questions->count();

                    return [
                        'id' => $participation->id,
                        'quiz_id' => $participation->quiz_id,
                        'quiz_name' => $participation->quiz->title,
                        'score' => $participation->total_score,
                        'total_score' => $totalPossibleScore,
                        'time_taken' => $participation->time_taken ?? 0, // Add this field to migration if missing
                        'completed_at' => $participation->updated_at, // or created_at
                        'created_at' => $participation->created_at,
                        'status' => 'completed', // Since it exists in participation table
                        'percentage' => $percentage,
                        'answers_correct' => $correctAnswers,
                        'total_questions' => $totalQuestions,
                    ];
                });
        });

        // Extract taken quiz IDs
        $takenQuizIds = $quizzesTaken->pluck('quiz_id')->toArray();

        // Fetch quizzes not yet taken with creator information
        $availableQuizzes = Cache::remember("quizzes_available_user_{$userId}", 600, function () use ($takenQuizIds) {
            return Quiz::with(['creator'])
                ->whereNotIn('id', $takenQuizIds)
                ->get()
                ->map(function ($quiz) {
                    return [
                        'quiz_id' => $quiz->id,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                        'mode' => $quiz->mode,
                        'total_score' => $quiz->total_score,
                        'total_time' => $quiz->total_time,
                        'creator_name' => $quiz->creator->name ?? 'Unknown',
                        'difficulty' => $quiz->difficulty ?? null,
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
        $quiz = Quiz::with(['creator', 'skillTags', 'questions'])->findOrFail($quiz_access->id);

        $userId = Auth::id();

        // Get all attempts for this quiz by the current user
        $allAttempts = QuizParticipation::with(['answers'])
            ->where('user_id', $userId)
            ->where('quiz_id', $quiz->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $latestAttempt = $allAttempts->first();
        $hasTaken = $allAttempts->isNotEmpty();

        // Transform attempts data
        $transformedAttempts = $allAttempts->map(function ($attempt) use ($quiz) {
            // Calculate total possible score
            $totalPossibleScore = $quiz->questions->sum(function($question) {
                return $question->score ?? 1;
            });

            // Calculate percentage
            $percentage = $totalPossibleScore > 0 ?
                round(($attempt->total_score / $totalPossibleScore) * 100, 1) : 0;

            // Calculate correct answers
            $correctAnswers = $attempt->answers()->where('isCorrect', 1)->count();
            $totalQuestions = $quiz->questions->count();

            return [
                'id' => $attempt->id,
                'score' => $attempt->total_score,
                'total_score' => $totalPossibleScore,
                'time_taken' => $attempt->time_taken ?? 0,
                'completed_at' => $attempt->updated_at,
                'percentage' => $percentage,
                'status' => 'completed',
                'answers_correct' => $correctAnswers,
                'total_questions' => $totalQuestions,
            ];
        });

        // Determine if user can retake (you can add your own logic here)
        $canRetake = false; // Set to true if you want to allow retakes

        return Inertia::render('quiz-participation-access/actions/view', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'mode' => $quiz->mode,
                'creator' => [
                    'name' => $quiz->creator->name ?? 'Unknown'
                ],
                'total_score' => $quiz->total_score,
                'total_time' => $quiz->total_time,
                'updated_at' => $quiz->updated_at,
                'difficulty' => $quiz->difficulty ?? null,
                'question_count' => $quiz->questions->count(),
                'skill_tags' => $quiz->skillTags->map(function($tag) {
                    return [
                        'id' => $tag->id,
                        'tag_title' => $tag->tag_title,
                        'description' => $tag->description,
                    ];
                }),
            ],
            'hasTaken' => $hasTaken,
            'attemptId' => $latestAttempt?->id,
            'latestAttempt' => $latestAttempt ? $transformedAttempts->first() : null,
            'allAttempts' => $transformedAttempts,
            'canRetake' => $canRetake,
        ]);
    }

        public function clearUserQuizCache($userId = null)
    {
        $userId = $userId ?? Auth::id();

        Cache::forget("quiz_participation_access_user_{$userId}");
        Cache::forget("quizzes_available_user_{$userId}");

        return response()->json(['message' => 'Cache cleared successfully']);
    }

    /**
     * Check if user has taken a specific quiz
     */
    public function hasUserTakenQuiz($quizId, $userId = null)
    {
        $userId = $userId ?? Auth::id();

        return QuizParticipation::where([
            'user_id' => $userId,
            'quiz_id' => $quizId
        ])->exists();
    }

    /**
     * Get user's quiz attempt data
     */
    public function getUserQuizAttempt($quizId, $userId = null)
    {
        $userId = $userId ?? Auth::id();

        return QuizParticipation::with(['answers', 'quiz.questions'])
            ->where([
                'user_id' => $userId,
                'quiz_id' => $quizId
            ])->first();
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
