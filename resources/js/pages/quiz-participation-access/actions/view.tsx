import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Trophy,
    Clock,
    User,
    Calendar,
    Play,
    Eye,
    CheckCircle,
    BarChart3,
    FileText,
    Star,
    Tag
} from 'lucide-react';

export type User = {
    id: string;
    name: string;
    email: string;
};

export type SkillTag = {
    id: number;
    tag_title: string;
    description: string;
};

export type Quiz = {
    id: string;
    title: string;
    description: string;
    mode: string;
    creator: User;
    total_score: number;
    total_time: number;
    updated_at: string;
    difficulty?: string;
    question_count?: number;
    skill_tags: SkillTag[];
};

// Enhanced attempt data
export type QuizAttempt = {
    id: number;
    score: number;
    total_score: number;
    time_taken: number;
    completed_at: string;
    percentage: number;
    status: 'completed' | 'in_progress';
    answers_correct: number;
    total_questions: number;
};

type ViewQuizProps = {
    quiz: Quiz;
    hasTaken: boolean;
    attemptId?: number;
    latestAttempt?: QuizAttempt;
    allAttempts?: QuizAttempt[];
    canRetake?: boolean;
};

export default function ViewQuiz({
    quiz,
    hasTaken,
    attemptId,
    latestAttempt,
    allAttempts = [],
    canRetake = false
}: ViewQuizProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Quizzes', href: '/quiz-access' },
        { title: 'View Quiz', href: `/quiz-access/${quiz.id}` },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const getScoreColor = (percentage: number): string => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 80) return 'text-blue-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeColor = (percentage: number): string => {
        if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200';
        if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    const getDifficultyColor = (difficulty?: string): string => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'hard': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Quiz - ${quiz.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-gradient-to-br from-blue-50 to-white p-6 shadow-md dark:bg-muted">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        asChild
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                        variant="outline"
                    >
                        <Link href={route('quiz-access.index')} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Quizzes
                        </Link>
                    </Button>

                    {hasTaken && latestAttempt && (
                        <Badge className={`${getScoreBadgeColor(latestAttempt.percentage)} text-sm px-3 py-1`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed - {latestAttempt.percentage.toFixed(1)}%
                        </Badge>
                    )}
                </div>

                {/* Quiz Header */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">
                                {quiz.title}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>by <span className="font-medium">{quiz.creator.name}</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Updated {formatDate(quiz.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {quiz.difficulty && (
                                <Badge className={getDifficultyColor(quiz.difficulty)}>
                                    {quiz.difficulty}
                                </Badge>
                            )}
                            <Badge variant="outline" className="capitalize">
                                {quiz.mode}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Quiz Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                            <CardContent className="p-6">
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-blue-700 mb-4">
                                    <FileText className="h-5 w-5" />
                                    Quiz Information
                                </h2>
                                <Separator className="mb-4" />

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-blue-800">{quiz.total_score}</div>
                                        <div className="text-xs text-blue-600">Total Points</div>
                                    </div>

                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Clock className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-blue-800">{formatTime(quiz.total_time)}</div>
                                        <div className="text-xs text-blue-600">Time Limit</div>
                                    </div>

                                    {quiz.question_count && (
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <BarChart3 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                                            <div className="text-lg font-bold text-blue-800">{quiz.question_count}</div>
                                            <div className="text-xs text-blue-600">Questions</div>
                                        </div>
                                    )}

                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Star className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-blue-800 capitalize">{quiz.mode}</div>
                                        <div className="text-xs text-blue-600">Mode</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-blue-700 mb-2">Description</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">{quiz.description}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Skill Tags Card */}
                        <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag className="h-5 w-5 text-blue-700" />
                                    <h2 className="text-xl font-semibold text-blue-700">Skills Assessed</h2>
                                </div>
                                <Separator className="mb-4" />

                                {quiz.skill_tags && quiz.skill_tags.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            This quiz will help you practice and assess the following skills:
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {quiz.skill_tags.map((tag) => (
                                                <div
                                                    key={tag.id}
                                                    className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3"
                                                >
                                                    <Badge
                                                        variant="secondary"
                                                        className="w-fit bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                    >
                                                        {tag.tag_title}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        {tag.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Tag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            No specific skills tagged for this quiz
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This quiz covers general knowledge in the subject area
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quiz Attempts History */}
                        {allAttempts.length > 0 && (
                            <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                                <CardContent className="p-6">
                                    <h2 className="flex items-center gap-2 text-xl font-semibold text-blue-700 mb-4">
                                        <BarChart3 className="h-5 w-5" />
                                        Attempt History
                                    </h2>
                                    <Separator className="mb-4" />

                                    <div className="space-y-3">
                                        {allAttempts.map((attempt, index) => (
                                            <div
                                                key={attempt.id}
                                                className={`p-4 rounded-lg border ${
                                                    index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant={index === 0 ? "default" : "secondary"}>
                                                            Attempt #{allAttempts.length - index}
                                                        </Badge>
                                                        <span className="text-sm text-gray-600">
                                                            {formatDate(attempt.completed_at)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                                                                {attempt.score}/{attempt.total_score}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {attempt.percentage.toFixed(1)}% • {formatTime(attempt.time_taken)}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            asChild
                                                        >
                                                            <Link href={`/quiz-result/${attempt.id}`}>
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Action Panel */}
                    <div className="space-y-6">
                        {/* Current Status */}
                        {latestAttempt && (
                            <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                                <CardContent className="p-6">
                                    <h3 className="flex items-center gap-2 font-semibold text-blue-700 mb-4">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        Latest Result
                                    </h3>

                                    <div className="text-center space-y-3">
                                        <div className={`text-3xl font-bold ${getScoreColor(latestAttempt.percentage)}`}>
                                            {latestAttempt.score}/{latestAttempt.total_score}
                                        </div>
                                        <Badge className={`text-sm px-3 py-1 ${getScoreBadgeColor(latestAttempt.percentage)}`}>
                                            {latestAttempt.percentage.toFixed(1)}%
                                        </Badge>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div>✓ {latestAttempt.answers_correct} out of {latestAttempt.total_questions} correct</div>
                                            <div>⏱️ Completed in {formatTime(latestAttempt.time_taken)}</div>
                                            <div>📅 {formatDate(latestAttempt.completed_at)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {hasTaken && latestAttempt ? (
                                        <>
                                            <Button
                                                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                                asChild
                                            >
                                                <Link href={`/quiz-result/${latestAttempt.id}`} className="flex items-center justify-center gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    View Detailed Results
                                                </Link>
                                            </Button>

                                            {canRetake && (
                                                <Button
                                                    className="w-full bg-green-600 text-white hover:bg-green-700"
                                                    asChild
                                                >
                                                    <Link href={`/quiz-participation?quiz_id=${quiz.id}`} className="flex items-center justify-center gap-2">
                                                        <Play className="h-4 w-4" />
                                                        Retake Quiz
                                                    </Link>
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <Button
                                            className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                            asChild
                                        >
                                            <Link href={`/quiz-participation?quiz_id=${quiz.id}`} className="flex items-center justify-center gap-2">
                                                <Play className="h-4 w-4" />
                                                Take Quiz
                                            </Link>
                                        </Button>
                                    )}

                                    <Button
                                        className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        variant="outline"
                                        asChild
                                    >
                                        <Link href="/quiz-access" className="flex items-center justify-center gap-2">
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to All Quizzes
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        {allAttempts.length > 1 && (
                            <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-blue-700 mb-4">Quick Stats</h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total Attempts</span>
                                            <span className="font-medium">{allAttempts.length}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Best Score</span>
                                            <span className="font-medium text-green-600">
                                                {Math.max(...allAttempts.map(a => a.percentage)).toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Average Score</span>
                                            <span className="font-medium">
                                                {(allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length).toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Best Time</span>
                                            <span className="font-medium text-blue-600">
                                                {formatTime(Math.min(...allAttempts.map(a => a.time_taken)))}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
