<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizParticipation;
use App\Models\QuizParticipationAnswer;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionChoices;
use App\Models\XpHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuizParticipationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $quizId = $request->query('quiz_id');
        $cacheKey = "quiz:{$quizId}:with_questions";

        $quizData = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($quizId) {
            $quiz = Quiz::with([
                'questions.choices'
            ])->findOrFail($quizId);

            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'total_time' => $quiz->total_time,
                'total_score' => $quiz->total_score,
                'mode' => $quiz->mode,
                'questions' => $quiz->questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'question_type' => $question->question_type,
                        'choices' => $question->choices?->map(fn($c) => [
                            'choice' => $c->choice,
                            'isCorrect' => $c->is_correct,
                        ])
                    ];
                }),
            ];
        });

        return Inertia::render('quiz-participation-management/index', [
            'quiz' => [
                'id' => $quizData['id'],
                'title' => $quizData['title'],
                'description' => $quizData['description'],
                'total_score' => $quizData['total_score'],
                'total_time' => $quizData['total_time'],
                'mode' => $quizData['mode'],
            ],
            'questions' => $quizData['questions'],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'answers' => 'nullable|array',
            'answers.*.question_id' => 'required|exists:quiz_questions,id',
            'answers.*.answer' => ['nullable', function ($attribute, $value, $fail) {
                if (!is_string($value) && !is_array($value)) {
                    $fail("The $attribute must be a string or an array.");
                }
            }],
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $userId = Auth::id();

                // Get quiz information for XP calculation
                $quiz = Quiz::with('questions')->findOrFail($request->quiz_id);

                // Check if user has already taken this quiz
                $existingParticipation = QuizParticipation::where([
                    'user_id' => $userId,
                    'quiz_id' => $request->quiz_id
                ])->first();

                if ($existingParticipation) {
                    return back()->withErrors(['quiz' => 'You have already taken this quiz.']);
                }

                // Create a new participation
                $participation = QuizParticipation::create([
                    'user_id' => $userId,
                    'quiz_id' => $request->quiz_id,
                    'total_score' => 0, // we'll calculate below
                ]);

                $totalScore = 0;
                $correctAnswers = 0;
                $totalQuestions = count($request->answers);

                foreach ($request->answers as $answerData) {
                    $questionId = $answerData['question_id'];
                    $userAnswer = $answerData['answer'];
                    $userAnswerFormatted = is_array($userAnswer) ? json_encode($userAnswer) : trim($userAnswer);

                    // Read-through cache for the question
                    $question = Cache::remember(
                        "quiz_question_{$questionId}",
                        60,
                        fn() => QuizQuestion::with('choices')->findOrFail($questionId)
                    );

                    $isCorrect = $this->evaluateAnswer($question, $userAnswer);
                    $isCorrectInt = $isCorrect ? 1 : 0;

                    if ($isCorrect) {
                        $totalScore += $question->score;
                        $correctAnswers++;
                    }

                    // Write-through cache for individual answer
                    $answerPayload = [
                        'quiz_participation_id' => $participation->id,
                        'quiz_question_id' => $questionId,
                        'answer' => $userAnswerFormatted,
                        'isCorrect' => $isCorrectInt,
                    ];

                    QuizParticipationAnswer::create($answerPayload);
                    Cache::put("quiz_answer_participation_{$participation->id}_q_{$questionId}", $answerPayload, 60);
                }

                // Update participation with total score
                $participation->update(['total_score' => $totalScore]);

                // Calculate and award XP
                $xpEarned = $this->calculateAndAwardXP($participation, $quiz, $totalScore, $correctAnswers, $totalQuestions);

                // Clear relevant caches
                Cache::put("quiz_participation_score_{$participation->id}", $totalScore, 60);
                Cache::forget("quiz_participation_access_user_{$userId}");
                Cache::forget("quizzes_available_user_{$userId}");

                return to_route('quiz-access.index')->with([
                    'success' => 'Quiz submitted successfully! You earned ' . $xpEarned . ' XP.',
                    'participation_id' => $participation->id,
                    'score' => $totalScore,
                    'xp_earned' => $xpEarned,
                    'percentage' => round(($correctAnswers / $totalQuestions) * 100, 1),
                ]);
            });
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'An error occurred while submitting your quiz. Please try again.']);
        }
    }

    /**
     * Evaluate if an answer is correct
     */
    private function evaluateAnswer($question, $userAnswer)
    {
        switch ($question->question_type) {
            case 'multiple_choice':
                $correctChoice = $question->choices
                    ->where('is_correct', 1)
                    ->first();

                return $correctChoice && trim($correctChoice->choice) === trim($userAnswer);

            case 'checkbox':
                $correctChoices = $question->choices
                    ->where('is_correct', 1)
                    ->pluck('choice')
                    ->map(fn($c) => trim($c))
                    ->sort()
                    ->values()
                    ->toArray();

                $userAnswerArray = is_array($userAnswer) ? $userAnswer : [$userAnswer];
                $userAnswerArray = array_map('trim', $userAnswerArray);
                sort($userAnswerArray);

                return $correctChoices === $userAnswerArray;

            case 'identification':
                // For identification questions, you might want to implement
                // more sophisticated matching (case-insensitive, etc.)
                $correctAnswers = $question->choices
                    ->where('is_correct', 1)
                    ->pluck('choice')
                    ->map(fn($c) => strtolower(trim($c)));

                return $correctAnswers->contains(strtolower(trim($userAnswer)));

            default:
                return false;
        }
    }

    /**
     * Calculate and award XP based on quiz performance
     */
    private function calculateAndAwardXP($participation, $quiz, $totalScore, $correctAnswers, $totalQuestions)
    {
        $userId = $participation->user_id;
        $percentage = ($correctAnswers / $totalQuestions) * 100;

        // Base XP calculation
        $baseXP = 50; // Base XP for completing a quiz
        $scoreXP = floor($totalScore * 2); // 2 XP per point scored

        // Performance multipliers
        $performanceMultiplier = 1;
        if ($percentage >= 90) {
            $performanceMultiplier = 1.5; // 50% bonus for excellent performance
        } elseif ($percentage >= 80) {
            $performanceMultiplier = 1.3; // 30% bonus for good performance
        } elseif ($percentage >= 70) {
            $performanceMultiplier = 1.1; // 10% bonus for decent performance
        }

        // Quiz difficulty multiplier (based on total possible score)
        $difficultyMultiplier = 1;
        if ($quiz->total_score >= 100) {
            $difficultyMultiplier = 1.4;
        } elseif ($quiz->total_score >= 50) {
            $difficultyMultiplier = 1.2;
        }

        // Time-based bonus (if quiz has time limit and completed quickly)
        $timeBonusXP = 0;
        if ($quiz->total_time && $percentage >= 60) {
            // Award bonus XP for completing within 75% of time limit with decent score
            $timeBonusXP = 25;
        }

        // Calculate final XP
        $calculatedXP = ($baseXP + $scoreXP) * $performanceMultiplier * $difficultyMultiplier + $timeBonusXP;
        $finalXP = max(10, floor($calculatedXP)); // Minimum 10 XP

        // Create XP history record
        XpHistory::create([
            'user_id' => $userId,
            'source' => 'quiz',
            'source_id' => $quiz->id,
            'xp_earned' => $finalXP,
            'description' => sprintf(
                'Completed quiz "%s" - Score: %d/%d (%.1f%%) - %d/%d correct answers',
                $quiz->title,
                $totalScore,
                $quiz->total_score,
                $percentage,
                $correctAnswers,
                $totalQuestions
            ),
        ]);

        // Update user's total XP (assuming you have an xp field in users table)
        $user = Auth::user();
        if ($user && isset($user->xp)) {
            $user->increment('xp', $finalXP);
        }

        return $finalXP;
    }

    /**
     * Get XP breakdown for a quiz (helper method for displaying XP calculation details)
     */
    public function getXpBreakdown($quizId, $totalScore, $correctAnswers, $totalQuestions)
    {
        $quiz = Quiz::findOrFail($quizId);
        $percentage = ($correctAnswers / $totalQuestions) * 100;

        $breakdown = [
            'base_xp' => 50,
            'score_xp' => floor($totalScore * 2),
            'performance_multiplier' => 1,
            'difficulty_multiplier' => 1,
            'time_bonus' => 0,
            'total_xp' => 0
        ];

        // Performance multiplier
        if ($percentage >= 90) {
            $breakdown['performance_multiplier'] = 1.5;
            $breakdown['performance_note'] = 'Excellent performance bonus (90%+)';
        } elseif ($percentage >= 80) {
            $breakdown['performance_multiplier'] = 1.3;
            $breakdown['performance_note'] = 'Good performance bonus (80%+)';
        } elseif ($percentage >= 70) {
            $breakdown['performance_multiplier'] = 1.1;
            $breakdown['performance_note'] = 'Decent performance bonus (70%+)';
        }

        // Difficulty multiplier
        if ($quiz->total_score >= 100) {
            $breakdown['difficulty_multiplier'] = 1.4;
            $breakdown['difficulty_note'] = 'High difficulty bonus';
        } elseif ($quiz->total_score >= 50) {
            $breakdown['difficulty_multiplier'] = 1.2;
            $breakdown['difficulty_note'] = 'Medium difficulty bonus';
        }

        // Time bonus
        if ($quiz->total_time && $percentage >= 60) {
            $breakdown['time_bonus'] = 25;
            $breakdown['time_note'] = 'Quick completion bonus';
        }

        $breakdown['total_xp'] = max(10, floor(
            ($breakdown['base_xp'] + $breakdown['score_xp']) *
            $breakdown['performance_multiplier'] *
            $breakdown['difficulty_multiplier'] +
            $breakdown['time_bonus']
        ));

        return $breakdown;
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(QuizParticipation $quizParticipation)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(QuizParticipation $quizParticipation)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, QuizParticipation $quizParticipation)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuizParticipation $quizParticipation)
    {
        //
    }
}
