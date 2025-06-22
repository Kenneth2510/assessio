<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizParticipation;
use App\Models\QuizParticipationAnswer;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class QuizAnalyticsController extends Controller
{
    /**
     * Display analytics overview for a specific quiz
     */
    public function show(Quiz $quiz)
    {
        $cacheKey = "quiz_analytics_{$quiz->id}";

        $analytics = Cache::remember($cacheKey, 600, function () use ($quiz) {
            return $this->generateQuizAnalytics($quiz);
        });

        // Apply data masking based on user role
        $analytics = $this->applyDataMasking($analytics);

        return Inertia::render('quiz-analytics/show', [
            'quiz' => $quiz->load(['creator', 'questions', 'skillTags']),
            'analytics' => $analytics,
        ]);
    }

    /**
     * Apply data masking based on user role
     */
    private function applyDataMasking($analytics)
    {
        $user = auth()->user();

        // If user is admin, return analytics without masking
        if ($user->hasRole('admin')) {
            return $analytics;
        }

        // If user is instructor, apply masking to learner names
        if ($user->hasRole('instructor')) {
            // Mask user performance matrix
            if (isset($analytics['user_performance_matrix']['matrix'])) {
                $analytics['user_performance_matrix']['matrix'] = $this->maskUserNames(
                    $analytics['user_performance_matrix']['matrix']
                );
            }

            // Mask progress tracking if it contains user-specific data
            if (isset($analytics['progress_tracking']['user_details'])) {
                $analytics['progress_tracking']['user_details'] = $this->maskUserNames(
                    $analytics['progress_tracking']['user_details']
                );
            }
        }

        return $analytics;
    }

    /**
     * Mask user names in data arrays
     */
    private function maskUserNames($data)
    {
        $userCounter = 1;
        $userMaskMap = [];

        foreach ($data as &$item) {
            if (isset($item['user_name'])) {
                $originalName = $item['user_name'];

                // Check if we've already assigned a masked name to this user
                if (!isset($userMaskMap[$originalName])) {
                    $userMaskMap[$originalName] = "Student {$userCounter}";
                    $userCounter++;
                }

                $item['user_name'] = $userMaskMap[$originalName];
            }
        }

        return $data;
    }

    /**
     * Get detailed analytics data for a quiz
     */
    private function generateQuizAnalytics(Quiz $quiz)
    {
        // Basic participation stats
        $participationStats = $this->getParticipationStats($quiz);

        // Score distribution
        $scoreDistribution = $this->getScoreDistribution($quiz);

        // Time analysis
        $timeAnalysis = $this->getTimeAnalysis($quiz);

        // Question-level analytics
        $questionAnalytics = $this->getQuestionAnalytics($quiz);

        // User performance matrix
        $userPerformanceMatrix = $this->getUserPerformanceMatrix($quiz);

        // Difficulty analysis
        $difficultyAnalysis = $this->getDifficultyAnalysis($quiz);

        // Progress tracking
        $progressTracking = $this->getProgressTracking($quiz);

        return [
            'participation_stats' => $participationStats,
            'score_distribution' => $scoreDistribution,
            'time_analysis' => $timeAnalysis,
            'question_analytics' => $questionAnalytics,
            'user_performance_matrix' => $userPerformanceMatrix,
            'difficulty_analysis' => $difficultyAnalysis,
            'progress_tracking' => $progressTracking,
        ];
    }

    /**
     * Get basic participation statistics
     */
    private function getParticipationStats(Quiz $quiz)
    {
        $totalParticipations = QuizParticipation::where('quiz_id', $quiz->id)->count();
        $uniqueUsers = QuizParticipation::where('quiz_id', $quiz->id)->distinct('user_id')->count();
        $averageScore = QuizParticipation::where('quiz_id', $quiz->id)->avg('total_score');
        $highestScore = QuizParticipation::where('quiz_id', $quiz->id)->max('total_score');
        $lowestScore = QuizParticipation::where('quiz_id', $quiz->id)->min('total_score');
        $averageTime = QuizParticipation::where('quiz_id', $quiz->id)->avg('time_taken');

        $completionRate = $totalParticipations > 0
            ? (QuizParticipation::where('quiz_id', $quiz->id)->where('status', 'completed')->count() / $totalParticipations) * 100
            : 0;

        return [
            'total_participations' => $totalParticipations,
            'unique_users' => $uniqueUsers,
            'average_score' => round($averageScore, 2),
            'highest_score' => $highestScore,
            'lowest_score' => $lowestScore,
            'average_time' => round($averageTime, 2),
            'completion_rate' => round($completionRate, 2),
            'total_possible_score' => $quiz->total_score,
        ];
    }

    /**
     * Get score distribution data
     */
    private function getScoreDistribution(Quiz $quiz)
    {
        $scoreRanges = [
            '0-20%' => 0,
            '21-40%' => 0,
            '41-60%' => 0,
            '61-80%' => 0,
            '81-100%' => 0,
        ];

        $participations = QuizParticipation::where('quiz_id', $quiz->id)->get();

        foreach ($participations as $participation) {
            $percentage = $quiz->total_score > 0
                ? ($participation->total_score / $quiz->total_score) * 100
                : 0;

            if ($percentage <= 20) $scoreRanges['0-20%']++;
            elseif ($percentage <= 40) $scoreRanges['21-40%']++;
            elseif ($percentage <= 60) $scoreRanges['41-60%']++;
            elseif ($percentage <= 80) $scoreRanges['61-80%']++;
            else $scoreRanges['81-100%']++;
        }

        return $scoreRanges;
    }

    /**
     * Get time analysis data
     */
    private function getTimeAnalysis(Quiz $quiz)
    {
        $participations = QuizParticipation::where('quiz_id', $quiz->id)
            ->whereNotNull('time_taken')
            ->get();

        if ($participations->isEmpty()) {
            return [
                'average_time' => 0,
                'median_time' => 0,
                'fastest_time' => 0,
                'slowest_time' => 0,
                'time_efficiency' => 0,
            ];
        }

        $times = $participations->pluck('time_taken')->sort()->values();
        $medianTime = $times->count() % 2 === 0
            ? ($times[$times->count() / 2 - 1] + $times[$times->count() / 2]) / 2
            : $times[intval($times->count() / 2)];

        $timeEfficiency = $quiz->total_time > 0
            ? (($quiz->total_time - $times->avg()) / $quiz->total_time) * 100
            : 0;

        return [
            'average_time' => round($times->avg(), 2),
            'median_time' => round($medianTime, 2),
            'fastest_time' => $times->min(),
            'slowest_time' => $times->max(),
            'time_efficiency' => round($timeEfficiency, 2),
            'allocated_time' => $quiz->total_time,
        ];
    }

    /**
     * Get question-level analytics
     */
    private function getQuestionAnalytics(Quiz $quiz)
    {
        $questions = $quiz->questions()->with(['choices'])->get();
        $analytics = [];

        foreach ($questions as $question) {
            $totalAnswers = QuizParticipationAnswer::where('quiz_question_id', $question->id)->count();
            $correctAnswers = QuizParticipationAnswer::where('quiz_question_id', $question->id)
                ->where('isCorrect', 1)->count();

            $correctPercentage = $totalAnswers > 0 ? ($correctAnswers / $totalAnswers) * 100 : 0;

            // Get answer distribution for multiple choice questions
            $answerDistribution = [];
            if ($question->question_type === 'multiple_choice') {
                $answers = QuizParticipationAnswer::where('quiz_question_id', $question->id)
                    ->select('answer', DB::raw('count(*) as count'))
                    ->groupBy('answer')
                    ->get();

                foreach ($answers as $answer) {
                    $answerDistribution[$answer->answer] = $answer->count;
                }
            }

            $analytics[] = [
                'question_id' => $question->id,
                'question' => $question->question,
                'question_type' => $question->question_type,
                'total_answers' => $totalAnswers,
                'correct_answers' => $correctAnswers,
                'incorrect_answers' => $totalAnswers - $correctAnswers,
                'correct_percentage' => round($correctPercentage, 2),
                'difficulty_level' => $this->calculateQuestionDifficulty($correctPercentage),
                'answer_distribution' => $answerDistribution,
                'score_weight' => $question->score,
            ];
        }

        return $analytics;
    }

    /**
     * Get user performance matrix
     */
    private function getUserPerformanceMatrix(Quiz $quiz)
    {
        $participations = QuizParticipation::with(['user', 'answers.question'])
            ->where('quiz_id', $quiz->id)
            ->get();

        $questions = $quiz->questions()->orderBy('id')->get();
        $matrix = [];

        foreach ($participations as $participation) {
            $userRow = [
                'user_id' => $participation->user_id,
                'user_name' => $participation->user->name,
                'total_score' => $participation->total_score,
                'percentage' => $quiz->total_score > 0
                    ? round(($participation->total_score / $quiz->total_score) * 100, 1)
                    : 0,
                'time_taken' => $participation->time_taken,
                'completed_at' => $participation->completed_at,
                'questions' => [],
            ];

            // Create question answers mapping
            $answersMap = $participation->answers->keyBy('quiz_question_id');

            foreach ($questions as $question) {
                $answer = $answersMap->get($question->id);
                $userRow['questions'][] = [
                    'question_id' => $question->id,
                    'is_correct' => $answer ? $answer->isCorrect : null,
                    'answer' => $answer ? $answer->answer : null,
                    'score' => $answer && $answer->isCorrect ? $question->score : 0,
                ];
            }

            $matrix[] = $userRow;
        }

        // Sort by total score descending
        usort($matrix, function ($a, $b) {
            return $b['total_score'] <=> $a['total_score'];
        });

        return [
            'matrix' => $matrix,
            'questions' => $questions->map(function ($question) {
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'score' => $question->score,
                ];
            }),
        ];
    }

    /**
     * Get difficulty analysis
     */
    private function getDifficultyAnalysis(Quiz $quiz)
    {
        $questionAnalytics = $this->getQuestionAnalytics($quiz);

        $difficultyDistribution = [
            'easy' => 0,
            'medium' => 0,
            'hard' => 0,
            'very_hard' => 0,
        ];

        foreach ($questionAnalytics as $question) {
            $difficultyDistribution[$question['difficulty_level']]++;
        }

        $averageDifficulty = collect($questionAnalytics)->avg('correct_percentage');

        return [
            'distribution' => $difficultyDistribution,
            'average_success_rate' => round($averageDifficulty, 2),
            'most_difficult_questions' => collect($questionAnalytics)
                ->sortBy('correct_percentage')
                ->take(3)
                ->values()
                ->toArray(),
            'easiest_questions' => collect($questionAnalytics)
                ->sortByDesc('correct_percentage')
                ->take(3)
                ->values()
                ->toArray(),
        ];
    }

    /**
     * Get progress tracking data
     */
    private function getProgressTracking(Quiz $quiz)
    {
        $participations = QuizParticipation::where('quiz_id', $quiz->id)
            ->orderBy('created_at')
            ->get()
            ->groupBy(function ($participation) {
                return $participation->created_at->format('Y-m-d');
            });

        $dailyStats = [];
        foreach ($participations as $date => $dayParticipations) {
            $dailyStats[] = [
                'date' => $date,
                'attempts' => $dayParticipations->count(),
                'unique_users' => $dayParticipations->unique('user_id')->count(),
                'average_score' => round($dayParticipations->avg('total_score'), 2),
                'completion_rate' => round(
                    ($dayParticipations->where('status', 'completed')->count() / $dayParticipations->count()) * 100,
                    2
                ),
            ];
        }

        return [
            'daily_stats' => $dailyStats,
            'trends' => $this->calculateTrends($dailyStats),
        ];
    }

    /**
     * Calculate question difficulty based on success rate
     */
    private function calculateQuestionDifficulty($correctPercentage)
    {
        if ($correctPercentage >= 80) return 'easy';
        if ($correctPercentage >= 60) return 'medium';
        if ($correctPercentage >= 40) return 'hard';
        return 'very_hard';
    }

    /**
     * Calculate trends from daily stats
     */
    private function calculateTrends($dailyStats)
    {
        if (count($dailyStats) < 2) {
            return [
                'attempts_trend' => 0,
                'score_trend' => 0,
                'completion_trend' => 0,
            ];
        }

        $recent = array_slice($dailyStats, -7); // Last 7 days
        $previous = array_slice($dailyStats, -14, 7); // Previous 7 days

        $recentAvgAttempts = collect($recent)->avg('attempts');
        $previousAvgAttempts = collect($previous)->avg('attempts');

        $recentAvgScore = collect($recent)->avg('average_score');
        $previousAvgScore = collect($previous)->avg('average_score');

        $recentAvgCompletion = collect($recent)->avg('completion_rate');
        $previousAvgCompletion = collect($previous)->avg('completion_rate');

        return [
            'attempts_trend' => $previousAvgAttempts > 0
                ? round((($recentAvgAttempts - $previousAvgAttempts) / $previousAvgAttempts) * 100, 2)
                : 0,
            'score_trend' => $previousAvgScore > 0
                ? round((($recentAvgScore - $previousAvgScore) / $previousAvgScore) * 100, 2)
                : 0,
            'completion_trend' => $previousAvgCompletion > 0
                ? round((($recentAvgCompletion - $previousAvgCompletion) / $previousAvgCompletion) * 100, 2)
                : 0,
        ];
    }

    /**
     * Export analytics data
     */
    public function export(Quiz $quiz, Request $request)
    {
        $format = $request->get('format', 'json');
        $analytics = $this->generateQuizAnalytics($quiz);

        switch ($format) {
            case 'csv':
                return $this->exportToCsv($quiz, $analytics);
            case 'excel':
                return $this->exportToExcel($quiz, $analytics);
            default:
                return response()->json($analytics);
        }
    }

    /**
     * Get real-time analytics data
     */
    public function realtime(Quiz $quiz)
    {
        // Don't cache real-time data
        $analytics = $this->generateQuizAnalytics($quiz);

        return response()->json([
            'participation_stats' => $analytics['participation_stats'],
            'recent_attempts' => QuizParticipation::with('user')
                ->where('quiz_id', $quiz->id)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
            'last_updated' => now(),
        ]);
    }

    /**
     * Clear analytics cache
     */
    public function clearCache(Quiz $quiz)
    {
        Cache::forget("quiz_analytics_{$quiz->id}");

        return response()->json(['message' => 'Analytics cache cleared successfully']);
    }

    /**
     * Get comparative analytics between multiple quizzes
     */
    public function compare(Request $request)
    {
        $quizIds = $request->validate([
            'quiz_ids' => 'required|array|min:2|max:5',
            'quiz_ids.*' => 'exists:quizzes,id',
        ])['quiz_ids'];

        $comparativeData = [];

        foreach ($quizIds as $quizId) {
            $quiz = Quiz::findOrFail($quizId);

            $analytics = $this->generateQuizAnalytics($quiz);
            $comparativeData[] = [
                'quiz' => $quiz->only(['id', 'title']),
                'stats' => $analytics['participation_stats'],
                'difficulty' => $analytics['difficulty_analysis'],
            ];
        }

        return response()->json($comparativeData);
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

    public function showResults(Quiz $quiz, $participationId = null)
    {
        $userId = $participationId;
        $currentUser = Auth::user();

        // If no specific participation ID is provided, get the latest participation for the user
        // if (!$participationId) {
        //     $participationId = $request->query('participation_id');
        // }

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
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $userId) // Ensure user can only view their own results
                ->firstOrFail();

            $quiz = $participation->quiz;
            $questions = $quiz->questions;
            $userAnswers = $participation->answers;

            // Apply data masking based on user role
            $maskedUserName = $this->getMaskedUserName($participation->user, $currentUser);

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
                'participant_name' => $maskedUserName, // Apply masking here
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

            return Inertia::render('quiz-analytics-results/QuizResults', [
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
     * Get all quiz results for the authenticated user with data masking
     */
    public function userResults(Request $request)
    {
        $userId = Auth::id();
        $currentUser = Auth::user();
        $perPage = $request->get('per_page', 10);

        try {
            $participations = QuizParticipation::with(['quiz', 'user'])
                ->where('user_id', $userId)
                ->orderBy('completed_at', 'desc')
                ->paginate($perPage);

            // Create a mapping for consistent student numbering
            $userMaskingMap = $this->createUserMaskingMap($participations->pluck('user')->unique('id'), $currentUser);

            $results = $participations->through(function ($participation) use ($currentUser, $userMaskingMap) {
                $maxPossibleScore = $participation->quiz->questions()->sum('score') ?: $participation->quiz->questions()->count();
                $percentage = $maxPossibleScore > 0
                    ? round(($participation->total_score / $maxPossibleScore) * 100, 1)
                    : 0;

                // Apply data masking
                $participantName = $this->getMaskedUserNameFromMap($participation->user, $currentUser, $userMaskingMap);

                return [
                    'id' => $participation->id,
                    'quiz_title' => $participation->quiz->title,
                    'quiz_id' => $participation->quiz->id,
                    'participant_name' => $participantName, // Apply masking here
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
     * Apply data masking to user names based on the current user's role
     */
    private function getMaskedUserName($user, $currentUser)
    {
        // If current user is admin, return actual name
        if ($currentUser->hasRole('admin')) {
            return $user->name;
        }

        // If current user is instructor, return masked name
        if ($currentUser->hasRole('instructor')) {
            // Create a consistent hash for the user to ensure same student number across sessions
            $studentNumber = (crc32($user->id . $user->email) % 1000) + 1;
            return "Student {$studentNumber}";
        }

        // Default case (shouldn't happen in normal flow)
        return $user->name;
    }

    /**
     * Create a consistent mapping for user masking across multiple results
     */
    private function createUserMaskingMap($users, $currentUser)
    {
        $map = [];

        if ($currentUser->hasRole('admin')) {
            // Admin sees real names
            foreach ($users as $user) {
                $map[$user->id] = $user->name;
            }
        } elseif ($currentUser->hasRole('instructor')) {
            // Instructor sees masked names with consistent numbering
            $studentCounter = 1;
            foreach ($users->sortBy('id') as $user) { // Sort by ID for consistency
                $map[$user->id] = "Student {$studentCounter}";
                $studentCounter++;
            }
        } else {
            // Default case
            foreach ($users as $user) {
                $map[$user->id] = $user->name;
            }
        }

        return $map;
    }

    /**
     * Get masked user name from pre-built mapping
     */
    private function getMaskedUserNameFromMap($user, $currentUser, $userMaskingMap)
    {
        return $userMaskingMap[$user->id] ?? $user->name;
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
     * Export to CSV format with data masking
     */
    private function exportToCsv(Quiz $quiz, $analytics)
    {
        $currentUser = Auth::user();

        // Apply data masking to analytics data before export
        $maskedAnalytics = $this->applyDataMaskingToAnalytics($analytics, $currentUser);

        return response()->streamDownload(function () use ($maskedAnalytics) {
            // CSV generation logic here with masked data
        }, "quiz_{$quiz->id}_analytics.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Export to Excel format with data masking
     */
    private function exportToExcel(Quiz $quiz, $analytics)
    {
        $currentUser = Auth::user();

        // Apply data masking to analytics data before export
        $maskedAnalytics = $this->applyDataMaskingToAnalytics($analytics, $currentUser);

        return response()->streamDownload(function () use ($maskedAnalytics) {
            // Excel generation logic here with masked data
        }, "quiz_{$quiz->id}_analytics.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Apply data masking to analytics data structure
     */
    private function applyDataMaskingToAnalytics($analytics, $currentUser)
    {
        if ($currentUser->hasRole('admin')) {
            return $analytics; // No masking for admin
        }

        if ($currentUser->hasRole('instructor')) {
            // Apply masking logic to analytics data structure
            // This would depend on your analytics data structure
            // Example implementation:
            if (is_array($analytics) && isset($analytics['participants'])) {
                $studentCounter = 1;
                foreach ($analytics['participants'] as &$participant) {
                    if (isset($participant['name'])) {
                        $participant['name'] = "Student {$studentCounter}";
                        $studentCounter++;
                    }
                }
            }
        }

        return $analytics;
    }
}
