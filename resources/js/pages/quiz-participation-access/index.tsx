import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, Clock, Trophy, Calendar, Eye } from 'lucide-react';

const breadcrumbs = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Quizzes',
        href: '/quiz-participation-access',
    },
];

// Enhanced types for better quiz attempt tracking
type QuizAttempt = {
    id: number;
    quiz_id: string;
    quiz_name: string;
    score: number;
    total_score: number;
    time_taken: number;
    completed_at: string;
    created_at: string;
    status: 'completed' | 'in_progress' | 'submitted';
    percentage: number;
};

type AvailableQuiz = {
    quiz_id: string;
    title: string;
    description: string;
    mode: string;
    total_time: number;
    total_score: number;
    creator_name?: string;
    difficulty?: string;
};

export default function QuizParticipationAccessIndex({
    quizzes_taken = [],
    quizzes_available = []
}: {
    quizzes_taken: QuizAttempt[];
    quizzes_available: AvailableQuiz[];
}) {
    const [search, setSearch] = useState('');

    const filterQuizzes = (quizzes: any[]) =>
        quizzes.filter((quiz) =>
            (quiz.title || quiz.quiz_name).toLowerCase().includes(search.toLowerCase())
        );

    function formatTime(seconds: number): string {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const pad = (val: number) => val.toString().padStart(2, '0');

        if (hrs > 0) {
            return `${hrs}h ${mins}m ${secs}s`;
        } else if (mins > 0) {
            return `${mins}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    function getScoreColor(percentage: number): string {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 80) return 'text-blue-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-red-600';
    }

    function getScoreBadgeColor(percentage: number): string {
        if (percentage >= 90) return 'bg-green-100 text-green-800';
        if (percentage >= 80) return 'bg-blue-100 text-blue-800';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quiz Participation" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Quiz Participation</h1>
                        <p className="text-muted-foreground">Manage your quiz attempts and explore available quizzes</p>
                    </div>
                    <Input
                        type="text"
                        placeholder="Search quizzes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>

                {/* Previously Taken Quizzes - Enhanced */}
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h2 className="text-xl font-semibold text-blue-900">Quiz Attempts</h2>
                        <Badge variant="secondary" className="ml-2">
                            {quizzes_taken.length} {quizzes_taken.length === 1 ? 'attempt' : 'attempts'}
                        </Badge>
                    </div>

                    {filterQuizzes(quizzes_taken).length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filterQuizzes(quizzes_taken).map((attempt) => (
                                <Card
                                    key={attempt.id}
                                    className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-blue-300"
                                >
                                    <CardContent className="p-5">
                                        <div className="space-y-3">
                                            {/* Quiz Title and Status */}
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-lg font-semibold text-blue-800 leading-tight">
                                                    {attempt.quiz_name}
                                                </h3>
                                                <Badge
                                                    className={`text-xs ${
                                                        attempt.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                                                </Badge>
                                            </div>

                                            {/* Score Display */}
                                            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                                    <span className="text-sm font-medium">Score</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                                                        {attempt.score}/{attempt.total_score}
                                                    </div>
                                                    {/* <Badge className={`text-xs ${getScoreBadgeColor(attempt.percentage)}`}>
                                                        {attempt.percentage.toFixed(1)}%
                                                    </Badge> */}
                                                </div>
                                            </div>

                                            {/* Attempt Details */}
                                            <div className="space-y-2 text-sm text-blue-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Time taken</span>
                                                    </div>
                                                    <span className="font-medium">{formatTime(attempt.time_taken)}</span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>Completed</span>
                                                    </div>
                                                    <span className="font-medium">
                                                        {new Date(attempt.completed_at || attempt.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                                                    asChild
                                                >
                                                    <a href={`/quiz-result/${attempt.id}`} className="flex items-center justify-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        View Results
                                                    </a>
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    asChild
                                                >
                                                    <a href={`/quiz-access/${attempt.quiz_id}`}>
                                                        Quiz Details
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-muted-foreground">No quiz attempts yet.</p>
                            <p className="text-sm text-muted-foreground">Start taking quizzes to see your progress here!</p>
                        </div>
                    )}
                </section>

                {/* Available Quizzes - Enhanced */}
                <section className="mt-8">
                    <div className="mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-blue-900">Available Quizzes</h2>
                        <Badge variant="secondary" className="ml-2">
                            {quizzes_available.length} available
                        </Badge>
                    </div>

                    {filterQuizzes(quizzes_available).length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filterQuizzes(quizzes_available).map((quiz) => (
                                <Card
                                    key={quiz.quiz_id}
                                    className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-blue-300"
                                >
                                    <CardContent className="p-5">
                                        <div className="space-y-3">
                                            {/* Quiz Title */}
                                            <div>
                                                <h3 className="text-lg font-semibold text-blue-800 leading-tight">
                                                    {quiz.title}
                                                </h3>
                                                {quiz.creator_name && (
                                                    <p className="text-xs text-blue-600 mt-1">by {quiz.creator_name}</p>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm text-blue-700 line-clamp-2">
                                                {quiz.description}
                                            </p>

                                            {/* Quiz Stats */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-1 rounded bg-white p-2 shadow-sm">
                                                    <Clock className="h-3 w-3 text-blue-500" />
                                                    <span>{formatTime(quiz.total_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 rounded bg-white p-2 shadow-sm">
                                                    <Trophy className="h-3 w-3 text-yellow-500" />
                                                    <span>{quiz.total_score} pts</span>
                                                </div>
                                            </div>

                                            {/* Mode and Difficulty */}
                                            <div className="flex gap-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {quiz.mode}
                                                </Badge>
                                                {quiz.difficulty && (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${
                                                            quiz.difficulty === 'Easy' ? 'border-green-300 text-green-700' :
                                                            quiz.difficulty === 'Medium' ? 'border-yellow-300 text-yellow-700' :
                                                            'border-red-300 text-red-700'
                                                        }`}
                                                    >
                                                        {quiz.difficulty}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                size="sm"
                                                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                                asChild
                                            >
                                                <a href={`/quiz-access/${quiz.quiz_id}`}>
                                                    Start Quiz
                                                </a>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-muted-foreground">No available quizzes at the moment.</p>
                            <p className="text-sm text-muted-foreground">Check back later for new quizzes!</p>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
