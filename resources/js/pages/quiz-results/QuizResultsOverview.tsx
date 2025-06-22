import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Trophy,
    Target,
    Clock,
    Star,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

interface QuizResultsOverviewProps {
    results: {
        total_score: number;
        max_possible_score: number;
        percentage: number;
        xp_earned: number;
        time_taken: number;
        quiz_time_limit?: number;
        total_questions: number;
        correct_answers: number;
        incorrect_answers: number;
        unanswered_questions: number;
    };
    performance: {
        grade: string;
        performance_level: string;
    };
    formatTime: (seconds: number) => string;
}

export default function QuizResultsOverview({ results, performance, formatTime }: QuizResultsOverviewProps) {
    const getPerformanceColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'excellent': return 'text-green-600 bg-green-50';
            case 'good': return 'text-blue-600 bg-blue-50';
            case 'average': return 'text-yellow-600 bg-yellow-50';
            case 'below average': return 'text-orange-600 bg-orange-50';
            case 'poor': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getTimeEfficiency = () => {
        if (!results.quiz_time_limit) return null;
        const timeUsedPercentage = (results.time_taken / results.quiz_time_limit) * 100;
        return Math.round(timeUsedPercentage);
    };

    const timeEfficiency = getTimeEfficiency();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score Card */}
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Final Score</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                        {results.total_score}/{results.max_possible_score}
                    </div>
                    <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Percentage</span>
                            <span className="font-medium">{results.percentage}%</span>
                        </div>
                        <Progress value={results.percentage} className="h-2" />
                    </div>
                    <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(performance.performance_level)}`}>
                        {performance.performance_level}
                    </div>
                </CardContent>
            </Card>

            {/* Accuracy Card */}
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {results.correct_answers}/{results.total_questions}
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>Correct</span>
                            </div>
                            <span className="font-medium">{results.correct_answers}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span>Incorrect</span>
                            </div>
                            <span className="font-medium">{results.incorrect_answers}</span>
                        </div>
                        {results.unanswered_questions > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                                    <span>Unanswered</span>
                                </div>
                                <span className="font-medium">{results.unanswered_questions}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Time Card */}
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Time Taken</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                        {formatTime(results.time_taken)}
                    </div>
                    <div className="mt-2 space-y-1">
                        {results.quiz_time_limit && (
                            <>
                                <div className="text-xs text-gray-600">
                                    Limit: {formatTime(results.quiz_time_limit)}
                                </div>
                                {timeEfficiency && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span>Time Used</span>
                                            <span className="font-medium">{timeEfficiency}%</span>
                                        </div>
                                        <Progress
                                            value={timeEfficiency}
                                            className="h-1"
                                        />
                                        <Badge
                                            variant={timeEfficiency > 90 ? "destructive" : timeEfficiency > 70 ? "secondary" : "default"}
                                            className="mt-1 text-xs"
                                        >
                                            {timeEfficiency > 90 ? 'Time Pressure' :
                                             timeEfficiency > 70 ? 'Good Pace' : 'Efficient'}
                                        </Badge>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* XP Card */}
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">XP Earned</CardTitle>
                    <Star className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                        {results.xp_earned}
                    </div>
                    <div className="mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>Experience Points</span>
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                            {results.xp_earned > 0 ? 'Gained' : 'No XP'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
