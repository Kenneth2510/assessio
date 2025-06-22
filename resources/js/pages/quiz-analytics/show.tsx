import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, Download, Eye, RefreshCw, Target, TrendingUp, Users, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    skill_tags: SkillTag[];
};

export type Analytics = {
    participation_stats: {
        total_participations: number;
        unique_users: number;
        average_score: number;
        highest_score: number;
        lowest_score: number;
        average_time: number;
        completion_rate: number;
        total_possible_score: number;
    };
    score_distribution: Record<string, number>;
    time_analysis: {
        average_time: number;
        median_time: number;
        fastest_time: number;
        slowest_time: number;
        time_efficiency: number;
        allocated_time: number;
    };
    question_analytics: Array<{
        question_id: number;
        question: string;
        question_type: string;
        total_answers: number;
        correct_answers: number;
        incorrect_answers: number;
        correct_percentage: number;
        difficulty_level: string;
        answer_distribution: Record<string, number>;
        score_weight: number;
    }>;
    user_performance_matrix: {
        matrix: Array<{
            user_id: string;
            user_name: string;
            total_score: number;
            percentage: number;
            time_taken: number;
            completed_at: string;
            questions: Array<{
                question_id: number;
                is_correct: boolean | null;
                answer: string | null;
                score: number;
            }>;
        }>;
        questions: Array<{
            id: number;
            question: string;
            score: number;
        }>;
    };
    difficulty_analysis: {
        distribution: Record<string, number>;
        average_success_rate: number;
        most_difficult_questions: Array<any>;
        easiest_questions: Array<any>;
    };
    progress_tracking: {
        daily_stats: Array<{
            date: string;
            attempts: number;
            unique_users: number;
            average_score: number;
            completion_rate: number;
        }>;
        trends: {
            attempts_trend: number;
            score_trend: number;
            completion_trend: number;
        };
    };
};

type QuizAnalyticsProps = {
    quiz: Quiz;
    analytics: Analytics;
};

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const DIFFICULTY_COLORS = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
    very_hard: '#7c2d12',
};

export default function QuizAnalytics({ quiz, analytics }: QuizAnalyticsProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedView, setSelectedView] = useState<'overview' | 'questions' | 'users'>('overview');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Quiz Management', href: '/quiz-management' },
        { title: quiz.title, href: `/quiz-management/${quiz.id}` },
        { title: 'Analytics', href: `/quiz-analytics/${quiz.id}` },
    ];

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (val: number) => String(val).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const refreshAnalytics = async () => {
        setIsRefreshing(true);
        try {
            await router.get(`/quiz-analytics/${quiz.id}/realtime`);
        } finally {
            setIsRefreshing(false);
        }
    };

    const exportAnalytics = (format: 'json' | 'csv' | 'excel') => {
        window.open(`/quiz-analytics/${quiz.id}/export?format=${format}`, '_blank');
    };

    // Transform data for charts
    const scoreDistributionData = Object.entries(analytics.score_distribution).map(([range, count]) => ({
        range,
        count,
        percentage: analytics.participation_stats.total_participations > 0 ? (count / analytics.participation_stats.total_participations) * 100 : 0,
    }));

    const difficultyDistributionData = Object.entries(analytics.difficulty_analysis.distribution).map(([level, count]) => ({
        level: level.replace('_', ' ').toUpperCase(),
        count,
        color: DIFFICULTY_COLORS[level as keyof typeof DIFFICULTY_COLORS],
    }));

    const progressData = analytics.progress_tracking.daily_stats.map((stat) => ({
        ...stat,
        date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Analytics - ${quiz.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-blue-50 p-6 shadow-md dark:bg-muted">
                {/* Header */}
                <div className="max-w-1/12">
                    <Button asChild variant="outline" className="mb-4">
                        <Link href={route('quiz-management.show', quiz.id)} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Quiz
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Quiz Analytics</h1>
                        <p className="text-lg font-medium text-blue-600">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                            by <span className="font-medium">{quiz.creator.name}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={refreshAnalytics}
                            disabled={isRefreshing}
                            variant="outline"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => exportAnalytics('csv')} variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button asChild className="bg-blue-500 text-white hover:bg-blue-600">
                            <Link href={`/quiz-management/${quiz.id}`}>Back to Quiz</Link>
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-blue-200">
                    {[
                        { key: 'overview', label: 'Overview', icon: TrendingUp },
                        { key: 'questions', label: 'Question Analysis', icon: Target },
                        { key: 'users', label: 'User Performance', icon: Users },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setSelectedView(key as any)}
                            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 font-medium transition-colors ${
                                selectedView === key ? 'bg-blue-500 text-white' : 'bg-white text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {selectedView === 'overview' && (
                    <div className="space-y-6">
                        {/* Key Stats Cards */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    title: 'Total Attempts',
                                    value: analytics.participation_stats.total_participations,
                                    icon: Users,
                                    color: 'blue',
                                    subtitle: `${analytics.participation_stats.unique_users} unique users`,
                                },
                                {
                                    title: 'Average Score',
                                    value: `${analytics.participation_stats.average_score}/${analytics.participation_stats.total_possible_score}`,
                                    icon: Target,
                                    color: 'green',
                                    subtitle: `${((analytics.participation_stats.average_score / analytics.participation_stats.total_possible_score) * 100).toFixed(1)}%`,
                                },
                                {
                                    title: 'Completion Rate',
                                    value: `${analytics.participation_stats.completion_rate}%`,
                                    icon: CheckCircle,
                                    color: 'emerald',
                                    subtitle: 'Successfully completed',
                                },
                                {
                                    title: 'Average Time',
                                    value: formatTime(analytics.time_analysis.average_time),
                                    icon: Clock,
                                    color: 'amber',
                                    subtitle: `of ${formatTime(analytics.time_analysis.allocated_time)} allocated`,
                                },
                            ].map((stat, index) => (
                                <div key={index} className={`rounded-2xl border border-${stat.color}-200 bg-white p-6 shadow-sm dark:bg-muted`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                                        </div>
                                        <div className={`rounded-full p-3 bg-${stat.color}-100`}>
                                            <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Score Distribution */}
                            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                                <h3 className="mb-4 text-lg font-semibold text-blue-700">Score Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={scoreDistributionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="range" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: any, name: string) => [
                                                name === 'count' ? `${value} attempts` : `${value.toFixed(1)}%`,
                                                name === 'count' ? 'Attempts' : 'Percentage',
                                            ]}
                                        />
                                        <Bar dataKey="count" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Question Difficulty Distribution */}
                            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                                <h3 className="mb-4 text-lg font-semibold text-blue-700">Question Difficulty</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={difficultyDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="count"
                                            label={({ level, count }) => `${level}: ${count}`}
                                        >
                                            {difficultyDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Progress Tracking */}
                        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                            <h3 className="mb-4 text-lg font-semibold text-blue-700">Quiz Attempts Over Time</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={progressData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="attempts" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                    <Area type="monotone" dataKey="unique_users" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Question Analysis Tab */}
                {selectedView === 'questions' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {analytics.question_analytics.map((question, index) => (
                                <div key={question.question_id} className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">
                                                Q{index + 1}. {question.question}
                                            </h4>
                                            <div className="mt-2 flex items-center gap-3">
                                                <Badge
                                                    variant="secondary"
                                                    style={{
                                                        backgroundColor:
                                                            DIFFICULTY_COLORS[question.difficulty_level as keyof typeof DIFFICULTY_COLORS] + '20',
                                                        color: DIFFICULTY_COLORS[question.difficulty_level as keyof typeof DIFFICULTY_COLORS],
                                                    }}
                                                >
                                                    {question.difficulty_level.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">{question.question_type}</span>
                                                <span className="text-sm text-muted-foreground">{question.score_weight} pts</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-600">{question.correct_percentage}%</div>
                                            <div className="text-sm text-muted-foreground">Success Rate</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>{question.correct_answers} correct</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            <span>{question.incorrect_answers} incorrect</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            <span>{question.total_answers} total responses</span>
                                        </div>
                                    </div>

                                    {/* Answer Distribution for Multiple Choice */}
                                    {question.question_type === 'multiple_choice' && Object.keys(question.answer_distribution).length > 0 && (
                                        <div className="mt-4">
                                            <h5 className="mb-2 font-medium text-gray-700">Answer Distribution:</h5>
                                            <div className="space-y-2">
                                                {Object.entries(question.answer_distribution).map(([answer, count]) => (
                                                    <div key={answer} className="flex items-center justify-between text-sm">
                                                        <span className="max-w-xs truncate">{answer}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-24 rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                                                                    style={{
                                                                        width: `${question.total_answers > 0 ? (count / question.total_answers) * 100 : 0}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="w-12 text-right">{count}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User Performance Tab */}
                {selectedView === 'users' && (
                    <div className="space-y-6">
                        {/* User Performance Matrix */}
                        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                            <h3 className="mb-4 text-lg font-semibold text-blue-700">User Performance Matrix</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="p-3 text-left font-medium">User</th>
                                            <th className="p-3 text-center font-medium">Score</th>
                                            <th className="p-3 text-center font-medium">%</th>
                                            <th className="p-3 text-center font-medium">Time</th>
                                            {analytics.user_performance_matrix.questions.map((q, idx) => (
                                                <th key={q.id} className="p-2 text-center text-xs font-medium">
                                                    Q{idx + 1}
                                                </th>
                                            ))}
                                            <th className="p-3 text-center font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.user_performance_matrix.matrix.map((user, idx) => (
                                            <tr
                                                key={user.user_id}
                                                className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                            >
                                                <td className="p-3">
                                                    <div>
                                                        <div className="font-medium">{user.user_name}</div>
                                                        {/* <div className="text-xs text-muted-foreground">
                                                            {formatDate(user.completed_at)}
                                                        </div> */}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center font-medium">
                                                    {user.total_score}/{analytics.participation_stats.total_possible_score}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge
                                                        variant={
                                                            user.percentage >= 70 ? 'default' : user.percentage >= 50 ? 'secondary' : 'destructive'
                                                        }
                                                        className={
                                                            user.percentage >= 70
                                                                ? 'bg-green-100 text-green-800'
                                                                : user.percentage >= 50
                                                                  ? 'bg-yellow-100 text-yellow-800'
                                                                  : 'bg-red-100 text-red-800'
                                                        }
                                                    >
                                                        {user.percentage}%
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center text-xs">{formatTime(user.time_taken)}</td>
                                                {user.questions.map((answer, qIdx) => (
                                                    <td key={qIdx} className="p-2 text-center">
                                                        {answer.is_correct === null ? (
                                                            <div className="mx-auto h-6 w-6 rounded-full bg-gray-200" />
                                                        ) : answer.is_correct ? (
                                                            <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircle className="mx-auto h-5 w-5 text-red-500" />
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="p-3 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={route('quiz.analytics-participation', {
                                                                quiz: quiz.id,
                                                                quiz_participation: user.user_id,
                                                            })}
                                                        >
                                                            <Eye className="mr-1 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* User List with Details */}
                        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                            <h3 className="mb-4 text-lg font-semibold text-blue-700">All Participants</h3>
                            <div className="space-y-3">
                                {analytics.user_performance_matrix.matrix.map((user, idx) => (
                                    <div
                                        key={user.user_id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                <span className="text-sm font-medium text-blue-600">{user.user_name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{user.user_name}</h4>
                                                {/* <p className="text-sm text-muted-foreground">
                                                    Completed on {formatDate(user.completed_at)}
                                                </p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {user.total_score}/{analytics.participation_stats.total_possible_score}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Score</div>
                                            </div>

                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-green-600">{user.percentage}%</div>
                                                <div className="text-xs text-muted-foreground">Success</div>
                                            </div>

                                            {/* <div className="text-center">
                                                <div className="text-lg font-semibold text-amber-600">
                                                    {Math.round(user.total_score * 0.1)} XP
                                                </div>
                                                <div className="text-xs text-muted-foreground">Earned</div>
                                            </div> */}

                                            {/* <div className="text-center">
                                                <div className="text-sm font-medium text-gray-600">
                                                    {formatTime(user.time_taken)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Time</div>
                                            </div> */}

                                            <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600" asChild>
                                                <Link
                                                    href={route('quiz.analytics-participation', { quiz: quiz.id, quiz_participation: user.user_id })}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    View Attempt
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {analytics.user_performance_matrix.matrix.length === 0 && (
                                    <div className="py-12 text-center">
                                        <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                        <p className="text-lg text-muted-foreground">No participants yet</p>
                                        <p className="text-sm text-muted-foreground">Share your quiz to start collecting data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
