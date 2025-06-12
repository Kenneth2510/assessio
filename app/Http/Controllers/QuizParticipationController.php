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
use Illuminate\Support\Facades\Log;
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
                        'score' => $question->score ?? 1, // Default score if null
                        'choices' => $question->choices?->map(fn($c) => [
                            'choice' => $c->choice,
                            'isCorrect' => $c->isCorrect, // Fixed: use correct field name
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
            'time_taken' => 'nullable|integer|min:0', // Add time_taken validation
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

                // Initialize scoring variables
                $totalScore = 0;
                $correctAnswers = 0;
                $totalQuestions = count($request->answers ?? []);
                $questionScores = []; // Track individual question scores
                $timeTaken = $request->time_taken ?? 0;

                // Create a new participation (without total_score initially)
                $participation = QuizParticipation::create([
                    'user_id' => $userId,
                    'quiz_id' => $request->quiz_id,
                    'total_score' => 0, // Will be updated after calculation
                    'xp_earned' => 0,   // Will be updated after XP calculation
                    'time_taken' => $timeTaken,
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

                // Process each answer
                foreach ($request->answers ?? [] as $answerData) {
                    $questionId = $answerData['question_id'];
                    $userAnswer = $answerData['answer'];
                    $userAnswerFormatted = is_array($userAnswer) ? json_encode($userAnswer) : trim($userAnswer);

                    // Get question with caching
                    $question = Cache::remember(
                        "quiz_question_{$questionId}",
                        60,
                        fn() => QuizQuestion::with('choices')->findOrFail($questionId)
                    );

                    // Ensure question has a score (default to 1 if null)
                    $questionScore = $question->score ?? 1;

                    // Evaluate the answer
                    $isCorrect = $this->evaluateAnswer($question, $userAnswer);
                    $earnedScore = 0;

                    if ($isCorrect) {
                        $earnedScore = $questionScore;
                        $totalScore += $questionScore;
                        $correctAnswers++;
                    }

                    // Store question score info for debugging
                    $questionScores[] = [
                        'question_id' => $questionId,
                        'possible_score' => $questionScore,
                        'earned_score' => $earnedScore,
                        'is_correct' => $isCorrect
                    ];

                    // Create answer record
                    QuizParticipationAnswer::create([
                        'quiz_participation_id' => $participation->id,
                        'quiz_question_id' => $questionId,
                        'answer' => $userAnswerFormatted,
                        'isCorrect' => $isCorrect ? 1 : 0,
                    ]);

                    // Cache individual answer
                    Cache::put("quiz_answer_participation_{$participation->id}_q_{$questionId}", [
                        'quiz_participation_id' => $participation->id,
                        'quiz_question_id' => $questionId,
                        'answer' => $userAnswerFormatted,
                        'isCorrect' => $isCorrect ? 1 : 0,
                        'earned_score' => $earnedScore,
                    ], 60);
                }

                // Calculate XP
                $xpEarned = $this->calculateAndAwardXP($participation, $quiz, $totalScore, $correctAnswers, $totalQuestions);

                // Update participation with final scores
                $participation->update([
                    'total_score' => $totalScore,
                    'xp_earned' => $xpEarned,
                ]);

                // Clear relevant caches to force refresh
                Cache::forget("quiz_participation_access_user_{$userId}");
                Cache::forget("quizzes_available_user_{$userId}");
                Cache::put("quiz_participation_score_{$participation->id}", $totalScore, 60);

                // Calculate percentage
                $maxPossibleScore = $quiz->questions->sum(fn($q) => $q->score ?? 1);
                $percentage = $maxPossibleScore > 0 ? round(($totalScore / $maxPossibleScore) * 100, 1) : 0;

                return to_route('quiz-access.index')->with([
                    'success' => 'Quiz submitted successfully! You earned ' . $xpEarned . ' XP.',
                    'participation_id' => $participation->id,
                    'score' => $totalScore,
                    'max_score' => $maxPossibleScore,
                    'xp_earned' => $xpEarned,
                    'percentage' => $percentage,
                    'correct_answers' => $correctAnswers,
                    'total_questions' => $totalQuestions,
                    'question_scores' => $questionScores, // For debugging
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Quiz submission error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'quiz_id' => $request->quiz_id,
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'An error occurred while submitting your quiz. Please try again.']);
        }
    }

    /**
     * Evaluate if an answer is correct
     */
    private function evaluateAnswer($question, $userAnswer)
    {
        // Handle empty/null answers
        if (
            $userAnswer === null || $userAnswer === '' ||
            (is_array($userAnswer) && empty($userAnswer))
        ) {
            return false;
        }

        switch ($question->question_type) {
            case 'multiple_choice':
                $correctChoice = $question->choices
                    ->where('isCorrect', 1) // Fixed: use correct field name
                    ->first();

                if (!$correctChoice) {
                    Log::warning("No correct choice found for question {$question->id}");
                    return false;
                }

                return trim($correctChoice->choice) === trim($userAnswer);

            case 'checkbox':
                $correctChoices = $question->choices
                    ->where('isCorrect', 1) // Fixed: use correct field name
                    ->pluck('choice')
                    ->map(fn($c) => trim($c))
                    ->sort()
                    ->values()
                    ->toArray();

                if (empty($correctChoices)) {
                    Log::warning("No correct choices found for checkbox question {$question->id}");
                    return false;
                }

                $userAnswerArray = is_array($userAnswer) ? $userAnswer : [$userAnswer];
                $userAnswerArray = array_map('trim', $userAnswerArray);
                sort($userAnswerArray);

                return $correctChoices === $userAnswerArray;

            case 'identification':
                $correctAnswers = $question->choices
                    ->where('isCorrect', 1) // Fixed: use correct field name
                    ->pluck('choice')
                    ->map(fn($c) => strtolower(trim($c)))
                    ->filter(); // Remove empty values

                if ($correctAnswers->isEmpty()) {
                    Log::warning("No correct answers found for identification question {$question->id}");
                    return false;
                }

                return $correctAnswers->contains(strtolower(trim($userAnswer)));

            default:
                Log::warning("Unknown question type: {$question->question_type} for question {$question->id}");
                return false;
        }
    }

    /**
     * Calculate and award XP based on quiz performance
     */
    private function calculateAndAwardXP($participation, $quiz, $totalScore, $correctAnswers, $totalQuestions)
    {
        $userId = $participation->user_id;

        // Prevent division by zero
        if ($totalQuestions == 0) {
            return 10; // Minimum XP for participation
        }

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
        $maxPossibleScore = $quiz->questions->sum(fn($q) => $q->score ?? 1);
        $difficultyMultiplier = 1;
        if ($maxPossibleScore >= 100) {
            $difficultyMultiplier = 1.4;
        } elseif ($maxPossibleScore >= 50) {
            $difficultyMultiplier = 1.2;
        }

        // Time-based bonus (if quiz has time limit and completed quickly)
        $timeBonusXP = 0;
        if ($quiz->total_time && $percentage >= 60) {
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
                $maxPossibleScore,
                $percentage,
                $correctAnswers,
                $totalQuestions
            ),
        ]);

        // Update user's total XP
        $user = Auth::user();
        if ($user && isset($user->xp)) {
            $user->increment('xp', $finalXP);
        }

        return $finalXP;
    }

    /**
     * Get XP breakdown for a quiz
     */
    public function getXpBreakdown($quizId, $totalScore, $correctAnswers, $totalQuestions)
    {
        $quiz = Quiz::with('questions')->findOrFail($quizId);
        $maxPossibleScore = $quiz->questions->sum(fn($q) => $q->score ?? 1);

        if ($totalQuestions == 0) {
            return ['error' => 'No questions found'];
        }

        $percentage = ($correctAnswers / $totalQuestions) * 100;

        $breakdown = [
            'base_xp' => 50,
            'score_xp' => floor($totalScore * 2),
            'performance_multiplier' => 1,
            'difficulty_multiplier' => 1,
            'time_bonus' => 0,
            'total_xp' => 0,
            'max_possible_score' => $maxPossibleScore,
            'percentage' => round($percentage, 1),
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
        if ($maxPossibleScore >= 100) {
            $breakdown['difficulty_multiplier'] = 1.4;
            $breakdown['difficulty_note'] = 'High difficulty bonus';
        } elseif ($maxPossibleScore >= 50) {
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
