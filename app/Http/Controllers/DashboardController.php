<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Quiz;
use App\Models\QuizParticipation;
use App\Models\User;
use App\Models\XpHistory;
use App\Models\SkillTags;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();

        // Redirect based on user role
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }
        if ($user->hasRole('instructor')) {
            return redirect()->route('instructor.dashboard');
        }
        if ($user->hasRole('learner')) {
            return redirect()->route('learner.dashboard');
        }

        // Fallback for users without specific roles
        return redirect()->route('login');
    }

    public function admin()
    {
        $user = Auth::user();
        if ($user->hasRole('instructor') && !$user->hasRole('admin')   && !$user->hasRole('learner')) {
            return redirect()->route('instructor.dashboard');
        }

        if (!$user->hasRole('instructor') && !$user->hasRole('admin')   && $user->hasRole('learner')) {
            return redirect()->route('learner.dashboard');
        }
        // Basic Statistics
        $totalUsers = User::count();
        $totalQuizzes = Quiz::count();
        $totalParticipations = QuizParticipation::count();
        $activeUsers = User::where('status', 'active')->count();

        // User role distribution
        $userRoles = [
            'admins' => User::role('admin')->count(),
            'instructors' => User::role('instructor')->count(),
            'learners' => User::role('learner')->count(),
        ];

        // Quiz mode distribution
        $quizModeDistribution = Quiz::select('mode', DB::raw('count(*) as count'))
            ->groupBy('mode')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->mode => $item->count];
            });

        // Skill tags distribution (how many quizzes use each skill tag)
        $skillTagsDistribution = SkillTags::withCount('quizzes')
            ->orderBy('quizzes_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($tag) {
                return [
                    'tag_title' => $tag->tag_title,
                    'count' => $tag->quizzes_count,
                    'description' => $tag->description
                ];
            });

        // Recent activities - more comprehensive
        $recentQuizzes = Quiz::with(['creator', 'skillTags'])
            ->withCount('questions')
            ->latest()
            ->limit(8)
            ->get();

        $recentParticipations = QuizParticipation::with(['user', 'quiz'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($participation) {
                return [
                    'id' => $participation->id,
                    'user' => $participation->user,
                    'quiz' => $participation->quiz,
                    'total_score' => $participation->total_score,
                    'percentage' => $participation->percentage,
                    'xp_earned' => $participation->xp_earned,
                    'time_taken' => $participation->time_taken,
                    'status' => $participation->status,
                    'created_at' => $participation->created_at,
                ];
            });

        // Top learners by XP growth (last 30 days)
        $topLearnersByXP = User::role('learner')
            ->select('users.*', DB::raw('COALESCE(SUM(xp_histories.xp_earned), 0) as total_xp'))
            ->leftJoin('xp_histories', function($join) {
                $join->on('users.id', '=', 'xp_histories.user_id')
                     ->where('xp_histories.created_at', '>=', now()->subDays(30));
            })
            ->groupBy('users.id')
            ->orderBy('total_xp', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_xp' => (int) $user->total_xp,
                    'quizzes_completed' => QuizParticipation::where('user_id', $user->id)
                        ->where('status', 'completed')
                        ->count(),
                    'average_score' => QuizParticipation::where('user_id', $user->id)
                        ->avg('total_score') ?? 0
                ];
            });

        // Top instructors by quiz creation
        $topInstructorsByQuizzes = User::role('instructor')
            ->withCount(['quizzes' => function($query) {
                $query->withCount('questions');
            }])
            ->orderBy('quizzes_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($instructor) {
                $quizzes = Quiz::where('user_id', $instructor->id)->get();
                $totalParticipations = QuizParticipation::whereIn('quiz_id', $quizzes->pluck('id'))->count();
                $averageScore = QuizParticipation::whereIn('quiz_id', $quizzes->pluck('id'))->avg('total_score') ?? 0;

                return [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                    'quizzes_count' => $instructor->quizzes_count,
                    'total_questions' => $quizzes->sum('questions_count'),
                    'total_participations' => $totalParticipations,
                    'average_score' => round($averageScore, 2),
                ];
            });

        // Monthly quiz creation trend (last 6 months)
        $quizCreationTrend = Quiz::select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Monthly participation trend (last 6 months)
        $participationTrend = QuizParticipation::select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Average scores by quiz mode
        $averageScoresByMode = Quiz::select('mode', DB::raw('AVG(quiz_participations.total_score) as avg_score'))
            ->leftJoin('quiz_participations', 'quizzes.id', '=', 'quiz_participations.quiz_id')
            ->groupBy('mode')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->mode => round($item->avg_score ?? 0, 2)];
            });

        return Inertia::render('dashboard/admin', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_quizzes' => $totalQuizzes,
                'total_participations' => $totalParticipations,
                'active_users' => $activeUsers,
            ],
            'user_roles' => $userRoles,
            'quiz_mode_distribution' => $quizModeDistribution,
            'skill_tags_distribution' => $skillTagsDistribution,
            'recent_quizzes' => $recentQuizzes,
            'recent_participations' => $recentParticipations,
            'top_learners_by_xp' => $topLearnersByXP,
            'top_instructors_by_quizzes' => $topInstructorsByQuizzes,
            'quiz_creation_trend' => $quizCreationTrend,
            'participation_trend' => $participationTrend,
            'average_scores_by_mode' => $averageScoresByMode,
        ]);
    }

    public function instructor()
    {
        $user = Auth::user();
        $currentDate = Carbon::now();

        // Get instructor's quizzes with enhanced data
        $myQuizzes = Quiz::where('user_id', $user->id)
            ->withCount(['questions', 'quizParticipations'])
            ->withAvg('quizParticipations as avg_score', 'total_score')
            ->with(['quizParticipations' => function($query) {
                $query->select('quiz_id', 'total_score', 'created_at')
                    ->orderBy('created_at', 'desc');
            }])
            ->latest()
            ->get()
            ->map(function($quiz) {
                // Calculate additional metrics
                $participations = $quiz->quizParticipations;
                $quiz->participations_count = $participations->count();
                $quiz->avg_score = $participations->avg('total_score') ?? 0;
                $quiz->completion_rate = $quiz->questions_count > 0 ?
                    ($participations->where('status', 'completed')->count() / max($participations->count(), 1)) * 100 : 0;

                // Recent activity (last 7 days)
                $recentParticipations = $participations->where('created_at', '>=', Carbon::now()->subDays(7));
                $quiz->recent_activity = $recentParticipations->count();

                return $quiz;
            });

        // Enhanced quiz participation stats
        $quizParticipations = QuizParticipation::whereIn('quiz_id', $myQuizzes->pluck('id'))
            ->with(['user:id,name,email', 'quiz:id,title'])
            ->latest()
            ->limit(15)
            ->get()
            ->map(function($participation) {
                // Calculate percentage based on quiz's total possible score
                $totalPossible = $participation->quiz->questions->sum('score') ?: $participation->quiz->questions->count();
                return $participation;
            });

        // Advanced statistics
        $stats = $this->calculateAdvancedStats($myQuizzes, $quizParticipations);

        // Top performing quizzes with enhanced metrics
        $topQuizzes = $myQuizzes->sortByDesc('avg_score')
            ->take(5)
            ->values();

        // Performance trends (last 30 days)
        $performanceTrends = $this->getPerformanceTrends($myQuizzes->pluck('id'));

        // Quiz difficulty analysis
        $difficultyAnalysis = $this->analyzeDifficulty($myQuizzes);

        // Student engagement metrics
        $engagementMetrics = $this->getEngagementMetrics($myQuizzes->pluck('id'));

        return Inertia::render('dashboard/instructor', [
            'stats' => $stats,
            'my_quizzes' => $myQuizzes,
            'recent_participations' => $quizParticipations,
            'top_quizzes' => $topQuizzes,
            'performance_trends' => $performanceTrends,
            'difficulty_analysis' => $difficultyAnalysis,
            'engagement_metrics' => $engagementMetrics,
        ]);
    }

    private function calculateAdvancedStats($quizzes, $participations)
    {
        $totalQuizzes = $quizzes->count();
        $totalParticipations = $participations->count();
        $totalQuestions = $quizzes->sum('questions_count');

        // Calculate average score more accurately
        $averageScore = $participations->avg('percentage') ?? 0;

        // Calculate trends (comparing last 30 days vs previous 30 days)
        $last30Days = Carbon::now()->subDays(30);
        $previous30Days = Carbon::now()->subDays(60);

        $recentParticipations = $participations->where('created_at', '>=', $last30Days)->count();
        $previousParticipations = $participations->whereBetween('created_at', [$previous30Days, $last30Days])->count();

        $participationTrend = $previousParticipations > 0 ?
            round((($recentParticipations - $previousParticipations) / $previousParticipations) * 100, 1) : 0;

        // Active students (students who participated in last 7 days)
        $activeStudents = $participations->where('created_at', '>=', Carbon::now()->subDays(7))
            ->unique('user_id')->count();

        // Quiz completion rate
        $completedQuizzes = $participations->where('status', 'completed')->count();
        $completionRate = $totalParticipations > 0 ?
            round(($completedQuizzes / $totalParticipations) * 100, 1) : 0;

        // Average time per quiz
        $avgTimePerQuiz = $participations->where('time_taken', '>', 0)->avg('time_taken') ?? 0;

        return [
            'total_quizzes' => $totalQuizzes,
            'total_participations' => $totalParticipations,
            'total_questions' => $totalQuestions,
            'average_score' => round($averageScore, 1),
            'active_students' => $activeStudents,
            'completion_rate' => $completionRate,
            'avg_time_per_quiz' => round($avgTimePerQuiz, 1),
            'participation_trend' => $participationTrend,
        ];
    }

    private function getPerformanceTrends($quizIds)
    {
        $trends = QuizParticipation::whereIn('quiz_id', $quizIds)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('AVG(total_score) as avg_score'),
                DB::raw('COUNT(*) as participation_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($trend) {
                return [
                    'date' => Carbon::parse($trend->date)->format('M d'),
                    'avg_score' => round($trend->avg_score, 1),
                    'participation_count' => $trend->participation_count,
                ];
            });

        return $trends;
    }

    private function analyzeDifficulty($quizzes)
    {
        $analysis = $quizzes->map(function($quiz) {
            $avgScore = $quiz->avg_score;

            if ($avgScore >= 85) {
                $difficulty = 'Easy';
                $color = '#10B981'; // green
            } elseif ($avgScore >= 70) {
                $difficulty = 'Medium';
                $color = '#F59E0B'; // yellow
            } elseif ($avgScore >= 50) {
                $difficulty = 'Hard';
                $color = '#EF4444'; // red
            } else {
                $difficulty = 'Very Hard';
                $color = '#7C2D12'; // dark red
            }

            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'avg_score' => round($avgScore, 1),
                'difficulty' => $difficulty,
                'color' => $color,
                'questions_count' => $quiz->questions_count,
                'participations_count' => $quiz->participations_count,
            ];
        });

        // Group by difficulty
        $grouped = $analysis->groupBy('difficulty');

        return [
            'individual' => $analysis->take(10), // Top 10 for display
            'summary' => $grouped->map(function($group, $difficulty) {
                return [
                    'difficulty' => $difficulty,
                    'count' => $group->count(),
                    'avg_score' => round($group->avg('avg_score'), 1),
                ];
            })->values(),
        ];
    }

    private function getEngagementMetrics($quizIds)
    {
        $last7Days = Carbon::now()->subDays(7);
        $last30Days = Carbon::now()->subDays(30);

        // Daily engagement for last 7 days
        $dailyEngagement = QuizParticipation::whereIn('quiz_id', $quizIds)
            ->where('created_at', '>=', $last7Days)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(DISTINCT user_id) as unique_students'),
                DB::raw('COUNT(*) as total_attempts')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($day) {
                return [
                    'date' => Carbon::parse($day->date)->format('M d'),
                    'unique_students' => $day->unique_students,
                    'total_attempts' => $day->total_attempts,
                ];
            });

        // Peak activity hours
        $peakHours = QuizParticipation::whereIn('quiz_id', $quizIds)
            ->where('created_at', '>=', $last30Days)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as attempts')
            )
            ->groupBy('hour')
            ->orderBy('attempts', 'desc')
            ->limit(5)
            ->get()
            ->map(function($hour) {
                return [
                    'hour' => $hour->hour . ':00',
                    'attempts' => $hour->attempts,
                ];
            });

        // Student retention (students who took multiple quizzes)
        $studentRetention = QuizParticipation::whereIn('quiz_id', $quizIds)
            ->select('user_id', DB::raw('COUNT(DISTINCT quiz_id) as quiz_count'))
            ->groupBy('user_id')
            ->get()
            ->groupBy(function($student) {
                if ($student->quiz_count == 1) return 'one_quiz';
                if ($student->quiz_count <= 3) return 'few_quizzes';
                if ($student->quiz_count <= 5) return 'regular';
                return 'highly_engaged';
            })
            ->map(function($group) {
                return $group->count();
            });

        return [
            'daily_engagement' => $dailyEngagement,
            'peak_hours' => $peakHours,
            'student_retention' => [
                'one_quiz' => $studentRetention['one_quiz'] ?? 0,
                'few_quizzes' => $studentRetention['few_quizzes'] ?? 0,
                'regular' => $studentRetention['regular'] ?? 0,
                'highly_engaged' => $studentRetention['highly_engaged'] ?? 0,
            ],
        ];
    }

    public function learner()
    {
        $user = Auth::user();

        // Learner's quiz participations
        $myParticipations = QuizParticipation::where('user_id', $user->id)
            ->with(['quiz', 'quiz.creator'])
            ->latest()
            ->get();

        // Available quizzes (not yet taken)
        $availableQuizzes = Quiz::whereNotIn('id', $myParticipations->pluck('quiz_id'))
            ->with(['creator', 'skillTags'])
            ->withCount('questions')
            ->latest()
            ->limit(10)
            ->get();

        // XP History
        $xpHistory = XpHistory::where('user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();

        // Statistics
        $totalQuizzesTaken = $myParticipations->count();
        $totalXpEarned = $xpHistory->sum('xp_earned');
        $averageScore = $myParticipations->avg('total_score') ?? 0;
        $completedQuizzes = $myParticipations->where('status', 'completed')->count();

        // Recent achievements/high scores
        $recentAchievements = $myParticipations
            ->where('total_score', '>', 80) // Consider scores above 80 as achievements
            ->sortByDesc('total_score')
            ->take(5);

        return Inertia::render('dashboard/learner', [
            'stats' => [
                'total_quizzes_taken' => $totalQuizzesTaken,
                'completed_quizzes' => $completedQuizzes,
                'total_xp_earned' => $totalXpEarned,
                'average_score' => round($averageScore, 2),
            ],
            'my_participations' => $myParticipations->take(10),
            'available_quizzes' => $availableQuizzes,
            'xp_history' => $xpHistory,
            'recent_achievements' => $recentAchievements,
        ]);
    }

    /**
     * Get dashboard data based on user role
     */
    public function getDashboardData()
    {
        $user = Auth::user();

        if ($user->hasRole('admin')) {
            return $this->getAdminDashboardData();
        } elseif ($user->hasRole('instructor')) {
            return $this->getInstructorDashboardData();
        } elseif ($user->hasRole('learner')) {
            return $this->getLearnerDashboardData();
        }

        return response()->json(['error' => 'Invalid role'], 403);
    }

    private function getAdminDashboardData()
    {
        return [
            'total_users' => User::count(),
            'total_quizzes' => Quiz::count(),
            'total_participations' => QuizParticipation::count(),
            'recent_activities' => QuizParticipation::with(['user', 'quiz'])
                ->latest()
                ->limit(5)
                ->get(),
        ];
    }

    private function getInstructorDashboardData()
    {
        $userId = Auth::id();
        return [
            'my_quizzes_count' => Quiz::where('user_id', $userId)->count(),
            'total_participations' => QuizParticipation::whereHas('quiz', function($query) use ($userId) {
                $query->where('user_id', $userId);
            })->count(),
        ];
    }

    private function getLearnerDashboardData()
    {
        $userId = Auth::id();
        return [
            'quizzes_taken' => QuizParticipation::where('user_id', $userId)->count(),
            'total_xp' => XpHistory::where('user_id', $userId)->sum('xp_earned'),
            'average_score' => QuizParticipation::where('user_id', $userId)->avg('total_score') ?? 0,
        ];
    }
}
