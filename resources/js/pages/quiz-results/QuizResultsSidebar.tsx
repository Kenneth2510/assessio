import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from '@inertiajs/react';
import {
    Trophy,
    Clock,
    Target,
    Star,
    RefreshCw,
    BookOpen,
    TrendingUp,
    Award,
    Calendar,
    Timer,
    CheckCircle2
} from 'lucide-react';

interface QuizResultsSidebarProps {
    results: {
        participation_id: number;
        quiz_title: string;
        total_score: number;
        max_possible_score: number;
        xp_earned: number;
        time_taken: number;
        quiz_time_limit?: number;
        completed_at: string;
        status: string;
        total_questions: number;
        correct_answers: number;
        percentage: number;
    };
    performance: {
        grade: string;
        performance_level: string;
        strengths: string[];
        areas_for_improvement: string[];
    };
    quiz: {
        id: number;
        title: string;
        description?: string;
        total_time?: number;
        mode: string;
    };
    can_retake: boolean;
    formatTime: (seconds: number) => string;
}

export default function QuizResultsSidebar({
    results,
    performance,
    quiz,
    can_retake,
    formatTime
}: QuizResultsSidebarProps) {
    const getGradeColor = (grade: string) => {
        switch (grade.toUpperCase()) {
            case 'A': return 'text-green-600 bg-green-50 border-green-200';
            case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'F': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPerformanceLevel = () => {
        const level = performance.performance_level.toLowerCase();
        switch (level) {
            case 'excellent':
                return { color: 'text-green-600', icon: <Trophy className="h-4 w-4" /> };
            case 'good':
                return { color: 'text-blue-600', icon: <CheckCircle2 className="h-4 w-4" /> };
            case 'average':
                return { color: 'text-yellow-600', icon: <Target className="h-4 w-4" /> };
            case 'below average':
                return { color: 'text-orange-600', icon: <TrendingUp className="h-4 w-4" /> };
            case 'poor':
                return { color: 'text-red-600', icon: <RefreshCw className="h-4 w-4" /> };
            default:
                return { color: 'text-gray-600', icon: <Target className="h-4 w-4" /> };
        }
    };

    const performanceInfo = getPerformanceLevel();

    return (
        <div className="w-full lg:w-80 space-y-4">
            {/* Quick Stats Card */}
            <Card className="shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Award className="h-5 w-5 text-blue-600" />
                        Quick Stats
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Grade */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Final Grade</span>
                        <div className={`px-3 py-1 rounded-lg border font-bold ${getGradeColor(performance.grade)}`}>
                            {performance.grade}
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Score</span>
                        <span className="font-semibold">
                            {results.total_score}/{results.max_possible_score}
                        </span>
                    </div>

                    {/* Percentage */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Percentage</span>
                            <span className="font-semibold">{results.percentage}%</span>
                        </div>
                        <Progress value={results.percentage} className="h-2" />
                    </div>

                    {/* Accuracy */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Correct Answers</span>
                        <span className="font-semibold">
                            {results.correct_answers}/{results.total_questions}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Level Card */}
            <Card className="shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={performanceInfo.color}>
                            {performanceInfo.icon}
                        </div>
                        <div>
                            <div className={`font-semibold ${performanceInfo.color}`}>
                                {performance.performance_level}
                            </div>
                            <div className="text-xs text-gray-500">Performance Level</div>
                        </div>
                    </div>

                    {/* Time Stats */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-gray-600">Time Taken</span>
                            </div>
                            <span className="font-medium">{formatTime(results.time_taken)}</span>
                        </div>

                        {results.quiz_time_limit && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Time Limit</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {formatTime(results.quiz_time_limit)}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-600" />
                                <span className="text-sm text-gray-600">Completed</span>
                            </div>
                            <span className="text-sm font-medium">
                                {new Date(results.completed_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* XP Earned Card */}
            {results.xp_earned > 0 && (
                <Card className="shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-purple-600" />
                            Experience Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-900 mb-2">
                                +{results.xp_earned}
                            </div>
                            <Badge className="bg-purple-100 text-purple-800">
                                XP Earned
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quiz Info Card */}
            <Card className="shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        Quiz Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Title</div>
                        <div className="font-medium text-gray-900 text-sm">
                            {quiz.title}
                        </div>
                    </div>

                    {quiz.description && (
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Description</div>
                            <div className="text-sm text-gray-700 leading-relaxed">
                                {quiz.description}
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="text-sm text-gray-600 mb-1">Mode</div>
                        <Badge variant="outline" className="text-xs">
                            {quiz.mode.charAt(0).toUpperCase() + quiz.mode.slice(1)}
                        </Badge>
                    </div>

                    <div>
                        <div className="text-sm text-gray-600 mb-1">Total Questions</div>
                        <div className="text-sm font-medium">{results.total_questions}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-lg">
                <CardContent className="p-4 space-y-3">
                    {can_retake && (
                        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                            <Link href={route('quiz-taker.show', quiz.id)} className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Retake Quiz
                            </Link>
                        </Button>
                    )}

                    <Button asChild variant="outline" className="w-full">
                        <Link href={route('quiz-access.show', quiz.id)} className="flex items-center justify-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Quiz Info
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                        <Link href={route('quiz-access.index')} className="flex items-center justify-center gap-2">
                            <Target className="h-4 w-4" />
                            More Quizzes
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Study Recommendations */}
            {performance.areas_for_improvement.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BookOpen className="h-5 w-5 text-orange-600" />
                            Study Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-orange-50 rounded-lg p-3">
                            <p className="text-sm text-orange-800 mb-2">
                                Focus on these areas for improvement:
                            </p>
                            <ul className="text-xs text-orange-700 space-y-1">
                                {performance.areas_for_improvement.slice(0, 3).map((area, index) => (
                                    <li key={index} className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                                        {area}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
