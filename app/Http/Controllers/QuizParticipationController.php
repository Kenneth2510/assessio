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

                // Clear analytics cache to ensure real-time updates for instructors/admins
                Cache::forget("quiz_analytics_{$request->quiz_id}");

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

    public function showResults(Request $request, $participationId = null)
    {
        $userId = Auth::id();

        // If no specific participation ID is provided, get the latest participation for the user
        if (!$participationId) {
            $participationId = $request->query('participation_id');
        }

        if (!$participationId) {
            return back()->withErrors(['error' => 'No quiz participation found.']);
        }

        try {
            // Get participation with related data
            $participation = QuizParticipation::with([
                'quiz.questions.choices',
                'answers.question.choices',
                'user'
            ])
                ->where('id', $participationId)
                ->where('user_id', $userId) // Ensure user can only view their own results
                ->firstOrFail();

            $quiz = $participation->quiz;
            $questions = $quiz->questions;
            $userAnswers = $participation->answers;

            // Calculate detailed results
            $results = [
                'participation_id' => $participation->id,
                'quiz_title' => $quiz->title,
                'quiz_description' => $quiz->description,
                'total_score' => $participation->total_score,
                'max_possible_score' => $quiz->questions->sum(fn($q) => $q->score ?? 1),
                'xp_earned' => $participation->xp_earned,
                'time_taken' => $participation->time_taken,
                'quiz_time_limit' => $quiz->total_time,
                'completed_at' => $participation->completed_at,
                'status' => $participation->status,
                'total_questions' => $questions->count(),
                'correct_answers' => 0,
                'incorrect_answers' => 0,
                'unanswered_questions' => 0,
            ];

            // Calculate percentage
            $results['percentage'] = $results['max_possible_score'] > 0
                ? round(($results['total_score'] / $results['max_possible_score']) * 100, 1)
                : 0;

            // Process each question and answer
            $questionResults = [];

            foreach ($questions as $question) {
                $userAnswer = $userAnswers->where('quiz_question_id', $question->id)->first();

                $questionResult = [
                    'question_id' => $question->id,
                    'question_text' => $question->question,
                    'question_type' => $question->question_type,
                    'question_score' => $question->score ?? 1,
                    'user_answer' => null,
                    'user_answer_display' => null,
                    'correct_answer' => null,
                    'correct_answer_display' => null,
                    'is_correct' => false,
                    'points_earned' => 0,
                    'choices' => $question->choices ? $question->choices->map(fn($c) => [
                        'choice' => $c->choice,
                        'is_correct' => $c->isCorrect
                    ])->toArray() : [],
                ];

                // Get correct answers based on question type
                switch ($question->question_type) {
                    case 'multiple_choice':
                        $correctChoice = $question->choices->where('isCorrect', 1)->first();
                        $questionResult['correct_answer'] = $correctChoice ? $correctChoice->choice : null;
                        $questionResult['correct_answer_display'] = $correctChoice ? $correctChoice->choice : 'No correct answer set';
                        break;

                    case 'checkbox':
                        $correctChoices = $question->choices->where('isCorrect', 1)->pluck('choice')->toArray();
                        $questionResult['correct_answer'] = $correctChoices;
                        $questionResult['correct_answer_display'] = !empty($correctChoices)
                            ? implode(', ', $correctChoices)
                            : 'No correct answers set';
                        break;

                    case 'identification':
                        $correctAnswers = $question->choices->where('isCorrect', 1)->pluck('choice')->toArray();
                        $questionResult['correct_answer'] = $correctAnswers;
                        $questionResult['correct_answer_display'] = !empty($correctAnswers)
                            ? implode(' / ', $correctAnswers)
                            : 'No correct answer set';
                        break;
                }

                // Process user answer if exists
                if ($userAnswer) {
                    $questionResult['user_answer'] = $userAnswer->answer;
                    $questionResult['is_correct'] = $userAnswer->isCorrect == 1;

                    // Format user answer for display
                    if ($question->question_type === 'checkbox') {
                        $userAnswerArray = is_string($userAnswer->answer)
                            ? json_decode($userAnswer->answer, true)
                            : $userAnswer->answer;
                        $questionResult['user_answer_display'] = is_array($userAnswerArray)
                            ? implode(', ', $userAnswerArray)
                            : $userAnswer->answer;
                    } else {
                        $questionResult['user_answer_display'] = $userAnswer->answer;
                    }

                    // Calculate points earned
                    if ($questionResult['is_correct']) {
                        $questionResult['points_earned'] = $question->score ?? 1;
                        $results['correct_answers']++;
                    } else {
                        $results['incorrect_answers']++;
                    }
                } else {
                    // Question was not answered
                    $questionResult['user_answer_display'] = 'Not answered';
                    $results['unanswered_questions']++;
                }

                $questionResults[] = $questionResult;
            }

            // Get XP breakdown if needed
            $xpBreakdown = $this->getXpBreakdown(
                $quiz->id,
                $results['total_score'],
                $results['correct_answers'],
                $results['total_questions']
            );

            // Performance analysis
            $performance = [
                'grade' => $this->calculateGrade($results['percentage']),
                'performance_level' => $this->getPerformanceLevel($results['percentage']),
                'strengths' => [],
                'areas_for_improvement' => [],
            ];

            // Analyze performance by question type
            $typeAnalysis = [];
            foreach (['multiple_choice', 'checkbox', 'identification'] as $type) {
                $typeQuestions = collect($questionResults)->where('question_type', $type);
                if ($typeQuestions->count() > 0) {
                    $typeCorrect = $typeQuestions->where('is_correct', true)->count();
                    $typeTotal = $typeQuestions->count();
                    $typePercentage = round(($typeCorrect / $typeTotal) * 100, 1);

                    $typeAnalysis[$type] = [
                        'total' => $typeTotal,
                        'correct' => $typeCorrect,
                        'percentage' => $typePercentage,
                        'type_label' => ucfirst(str_replace('_', ' ', $type))
                    ];

                    if ($typePercentage >= 80) {
                        $performance['strengths'][] = $typeAnalysis[$type]['type_label'];
                    } elseif ($typePercentage < 60) {
                        $performance['areas_for_improvement'][] = $typeAnalysis[$type]['type_label'];
                    }
                }
            }

            // Check if this is the user's best attempt (for future implementations)
            $previousAttempts = QuizParticipation::where('user_id', $userId)
                ->where('quiz_id', $quiz->id)
                ->where('id', '!=', $participation->id)
                ->count();

            return Inertia::render('quiz-results/QuizResults', [
                'results' => $results,
                'questions' => $questionResults,
                'performance' => $performance,
                'type_analysis' => $typeAnalysis,
                'xp_breakdown' => $xpBreakdown,
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'total_time' => $quiz->total_time,
                    'mode' => $quiz->mode,
                ],
                'is_first_attempt' => $previousAttempts === 0,
                'can_retake' => false, // Set based on your business logic
            ]);
        } catch (\Exception $e) {
            Log::error('Error displaying quiz results: ' . $e->getMessage(), [
                'user_id' => $userId,
                'participation_id' => $participationId,
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'Unable to load quiz results. Please try again.']);
        }
    }

    /**
     * Get all quiz results for the authenticated user
     */
    public function userResults(Request $request)
    {
        $userId = Auth::id();
        $perPage = $request->get('per_page', 10);

        try {
            $participations = QuizParticipation::with(['quiz'])
                ->where('user_id', $userId)
                ->orderBy('completed_at', 'desc')
                ->paginate($perPage);

            $results = $participations->through(function ($participation) {
                $maxPossibleScore = $participation->quiz->questions()->sum('score') ?: $participation->quiz->questions()->count();
                $percentage = $maxPossibleScore > 0
                    ? round(($participation->total_score / $maxPossibleScore) * 100, 1)
                    : 0;

                return [
                    'id' => $participation->id,
                    'quiz_title' => $participation->quiz->title,
                    'quiz_id' => $participation->quiz->id,
                    'total_score' => $participation->total_score,
                    'max_possible_score' => $maxPossibleScore,
                    'percentage' => $percentage,
                    'xp_earned' => $participation->xp_earned,
                    'time_taken' => $participation->time_taken,
                    'completed_at' => $participation->completed_at,
                    'status' => $participation->status,
                    'grade' => $this->calculateGrade($percentage),
                ];
            });

            return Inertia::render('quiz-results/index', [
                'results' => $results,
                'stats' => [
                    'total_quizzes_taken' => $participations->total(),
                    'average_score' => $participations->avg('total_score'),
                    'total_xp_earned' => $participations->sum('xp_earned'),
                    'best_score' => $participations->max('total_score'),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user quiz results: ' . $e->getMessage(), [
                'user_id' => $userId,
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'Unable to load your quiz history. Please try again.']);
        }
    }

    /**
     * Calculate letter grade based on percentage
     */
    private function calculateGrade($percentage)
    {
        if ($percentage >= 97) return 'A+';
        if ($percentage >= 93) return 'A';
        if ($percentage >= 90) return 'A-';
        if ($percentage >= 87) return 'B+';
        if ($percentage >= 83) return 'B';
        if ($percentage >= 80) return 'B-';
        if ($percentage >= 77) return 'C+';
        if ($percentage >= 73) return 'C';
        if ($percentage >= 70) return 'C-';
        if ($percentage >= 67) return 'D+';
        if ($percentage >= 65) return 'D';
        return 'F';
    }

    /**
     * Get performance level description
     */
    private function getPerformanceLevel($percentage)
    {
        if ($percentage >= 90) return 'Excellent';
        if ($percentage >= 80) return 'Good';
        if ($percentage >= 70) return 'Satisfactory';
        if ($percentage >= 60) return 'Needs Improvement';
        return 'Poor';
    }

    /**
     * Export quiz results to PDF (optional feature)
     */
    public function exportResults($participationId)
    {
        // This would integrate with a PDF library like DomPDF or TCPDF
        // Implementation depends on your PDF requirements

        $userId = Auth::id();

        $participation = QuizParticipation::with([
            'quiz.questions.choices',
            'answers.question.choices',
            'user'
        ])
            ->where('id', $participationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Generate PDF logic here
        // Return PDF download response

        return response()->json(['message' => 'PDF export feature coming soon']);
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
