import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    BookOpen,
    Brain,
    CheckCircle,
    Clock,
    Eye,
    Filter,
    Minus,
    RefreshCw,
    Settings,
    Target,
    Timer,
    TrendingUp,
    Trophy,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
];

// Enhanced Stat Card Component
const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend, description }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        red: 'bg-red-50 text-red-700 border-red-200',
    };

    const getTrendIcon = () => {
        if (trend > 0) return <ArrowUp className="h-4 w-4" />;
        if (trend < 0) return <ArrowDown className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getTrendColor = () => {
        if (trend > 0) return 'text-green-600';
        if (trend < 0) return 'text-red-600';
        return 'text-gray-500';
    };

    return (
        <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className={`rounded-lg p-3 ${colorClasses[color]} transition-transform group-hover:scale-110`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                        {description && <p className="mt-1 text-xs text-blue-600">{description}</p>}
                    </div>
                </div>
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center text-sm font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="ml-1">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Performance Trends Chart
const PerformanceTrendsChart = ({ trends }) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">📈 Performance Trends (30 days)</h3>
                </div>
                <div className="text-sm text-gray-500">Daily averages</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorParticipation" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                        }}
                    />
                    <Area type="monotone" dataKey="avg_score" stroke="#3B82F6" fillOpacity={1} fill="url(#colorScore)" name="Avg Score" />
                    <Area
                        type="monotone"
                        dataKey="participation_count"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorParticipation)"
                        name="Participations"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// Quiz Difficulty Analysis
const QuizDifficultyAnalysis = ({ difficultyAnalysis }) => {
    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#7C2D12'];

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center">
                <Brain className="mr-2 h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">🧠 Quiz Difficulty Distribution</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={difficultyAnalysis?.summary || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ difficulty, count }) => `${difficulty}: ${count}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {(difficultyAnalysis?.summary || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                    {(difficultyAnalysis?.summary || []).map((item, index) => (
                        <div key={item.difficulty} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                            <div className="flex items-center">
                                <div className="mr-3 h-4 w-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="font-medium">{item.difficulty}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{item.count} quizzes</div>
                                <div className="text-sm text-gray-500">{item.avg_score}% avg</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Student Engagement Dashboard
const StudentEngagement = ({ engagementMetrics }) => {
    const retentionData = [
        { name: 'Highly Engaged', value: engagementMetrics?.student_retention?.highly_engaged || 0, color: '#10B981' },
        { name: 'Regular', value: engagementMetrics?.student_retention?.regular || 0, color: '#3B82F6' },
        { name: 'Few Quizzes', value: engagementMetrics?.student_retention?.few_quizzes || 0, color: '#F59E0B' },
        { name: 'One Quiz Only', value: engagementMetrics?.student_retention?.one_quiz || 0, color: '#EF4444' },
    ];

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center">
                <Zap className="mr-2 h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">⚡ Student Engagement Insights</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Daily Engagement */}
                <div>
                    <h4 className="mb-3 font-medium text-gray-700">Daily Activity (Last 7 Days)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={engagementMetrics?.daily_engagement || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="unique_students" fill="#3B82F6" name="Unique Students" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="total_attempts" fill="#10B981" name="Total Attempts" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Student Retention */}
                <div>
                    <h4 className="mb-3 font-medium text-gray-700">Student Retention Levels</h4>
                    <div className="space-y-3">
                        {retentionData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                <div className="flex items-center">
                                    <div className="mr-3 h-4 w-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Peak Hours */}
            <div className="mt-6">
                <h4 className="mb-3 font-medium text-gray-700">Peak Activity Hours</h4>
                <div className="flex flex-wrap gap-2">
                    {(engagementMetrics?.peak_hours || []).map((hour, index) => (
                        <div key={hour.hour} className="rounded-full bg-blue-100 px-3 py-2 text-sm font-medium text-blue-800">
                            {hour.hour} ({hour.attempts} attempts)
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Enhanced Recent Participations
const RecentParticipations = ({ participations }) => {
    const [filter, setFilter] = useState('all');

    const filteredParticipations =
        participations?.filter((p) => {
            const percentage = p.percentage || 0;
            if (filter === 'all') return true;
            if (filter === 'high' && percentage >= 80) return true;
            if (filter === 'medium' && percentage >= 60 && percentage < 80) return true;
            if (filter === 'low' && percentage < 60) return true;
            return false;
        }) || [];

    const maskedParticipations = filteredParticipations.map((participation, index) => ({
        ...participation,
        maskedName: `Student ${index + 1}`,
    }));

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">👁️ Recent Quiz Attempts</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                        <option value="all">All Scores</option>
                        <option value="high">High (≥80%)</option>
                        <option value="medium">Medium (60-79%)</option>
                        <option value="low">Low (&lt;60%)</option>
                    </select>
                </div>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto">
                {maskedParticipations.map((participation) => (
                    <div
                        key={participation.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 transition-all duration-200 hover:shadow-md"
                    >
                        <div className="flex items-center">
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${
                                    (participation.percentage || 0) >= 90
                                        ? 'bg-green-500'
                                        : (participation.percentage || 0) >= 80
                                          ? 'bg-blue-500'
                                          : (participation.percentage || 0) >= 70
                                            ? 'bg-yellow-500'
                                            : (participation.percentage || 0) >= 60
                                              ? 'bg-orange-500'
                                              : 'bg-red-500'
                                }`}
                            >
                                {participation.maskedName.split(' ')[1]}
                            </div>
                            <div className="ml-4">
                                <p className="font-medium text-gray-900">{participation.maskedName}</p>
                                <p className="max-w-48 truncate text-sm text-gray-600">{participation.quiz?.title}</p>
                                <div className="mt-2 flex items-center space-x-2">
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            (participation.percentage || 0) >= 80
                                                ? 'bg-green-100 text-green-800'
                                                : (participation.percentage || 0) >= 60
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {Math.round(participation.percentage || 0)}%
                                    </span>
                                    {participation.xp_earned && (
                                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                            +{participation.xp_earned} XP
                                        </span>
                                    )}
                                    {participation.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{participation.total_score || 0}</p>
                            <p className="flex items-center justify-end text-sm text-gray-500">
                                <Timer className="mr-1 h-3 w-3" />
                                {participation.time_taken || 0}min
                            </p>
                            <p className="text-xs text-gray-400">{new Date(participation.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                {maskedParticipations.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                        <Target className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p>No quiz attempts match your filter</p>
                        <p className="text-sm">Try adjusting the filter settings</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Top Performing Quizzes Component
const TopPerformingQuizzes = ({ topQuizzes }) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">🏆 Top Performing Quizzes</h3>
            </div>
            <div className="space-y-4">
                {topQuizzes?.map((quiz, index) => (
                    <div
                        key={quiz.id}
                        className="flex items-center justify-between rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4"
                    >
                        <div className="flex items-center">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                                }`}
                            >
                                {index + 1}
                            </div>
                            <div className="ml-4">
                                <h4 className="max-w-48 truncate font-medium text-gray-900">{quiz.title}</h4>
                                <div className="mt-1 flex items-center space-x-2">
                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">{quiz.questions_count} questions</span>
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                        {quiz.participations_count} attempts
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{Math.round(quiz.avg_score || 0)}%</div>
                            <div className="text-sm text-gray-500">Average Score</div>
                        </div>
                    </div>
                ))}
                {(!topQuizzes || topQuizzes.length === 0) && (
                    <div className="py-8 text-center text-gray-500">
                        <BookOpen className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p>No quiz data available yet</p>
                        <p className="text-sm">Create some quizzes to see performance metrics</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Quiz Overview Component
const QuizOverview = ({ myQuizzes }) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">📚 My Quizzes Overview</h3>
                </div>
            </div>
            <div className="max-h-80 space-y-4 overflow-y-auto">
                {myQuizzes?.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                        <div className="flex-1">
                            <h4 className="mb-1 font-medium text-gray-900">{quiz.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                    <Target className="mr-1 h-4 w-4" />
                                    {quiz.questions_count} questions
                                </span>
                                <span className="flex items-center">
                                    <Users className="mr-1 h-4 w-4" />
                                    {quiz.participations_count} attempts
                                </span>
                                <span className="flex items-center">
                                    <Activity className="mr-1 h-4 w-4" />
                                    {quiz.recent_activity} recent
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div
                                className={`text-lg font-bold ${
                                    (quiz.avg_score || 0) >= 80 ? 'text-green-600' : (quiz.avg_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}
                            >
                                {Math.round(quiz.avg_score || 0)}%
                            </div>
                            <div className="text-xs text-gray-500">{Math.round(quiz.completion_rate || 0)}% completion</div>
                        </div>
                    </div>
                ))}
                {(!myQuizzes || myQuizzes.length === 0) && (
                    <div className="py-8 text-center text-gray-500">
                        <BookOpen className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p>No quizzes created yet</p>
                        <p className="text-sm">Start by creating your first quiz</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Main Dashboard Component
export default function Dashboard({
    stats,
    my_quizzes,
    recent_participations,
    top_quizzes,
    performance_trends,
    difficulty_analysis,
    engagement_metrics,
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = () => {
        setRefreshing(true);
        // Simulate refresh
        setTimeout(() => setRefreshing(false), 1000);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'engagement', label: 'Engagement', icon: Zap },
        { id: 'quizzes', label: 'My Quizzes', icon: BookOpen },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instructor Dashboard" />
            <div className="min-h-screen bg-gray-50">
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                    {/* Enhanced Header */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
                        <div className="absolute inset-0 bg-black opacity-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="mb-2 text-3xl font-bold">Welcome back, Instructor! 🎓</h1>
                                    <p className="text-lg text-gray-100">Transform learning through data-driven insights</p>
                                    <div className="mt-4 flex items-center space-x-6">
                                        <div className="flex items-center">
                                            <BookOpen className="mr-2 h-5 w-5" />
                                            <span>{stats?.total_quizzes || 0} Total Quizzes</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="mr-2 h-5 w-5" />
                                            <span>{stats?.active_students || 0} Active Students</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Trophy className="mr-2 h-5 w-5" />
                                            <span>{stats?.average_score || 0}% Avg Score</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleRefresh}
                                        className="bg-opacity-20 hover:bg-opacity-30 rounded-lg bg-white p-2 transition-all"
                                        disabled={refreshing}
                                    >
                                        <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="bg-opacity-20 hover:bg-opacity-30 rounded-lg bg-white p-2 transition-all">
                                        <Settings className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="flex space-x-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content based on active tab */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Key Statistics */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <StatCard
                                    icon={BookOpen}
                                    title="Total Quizzes"
                                    value={stats?.total_quizzes}
                                    color="blue"
                                    description="All created quizzes"
                                />
                                <StatCard
                                    icon={Users}
                                    title="Quiz Participations"
                                    value={stats?.total_participations}
                                    color="green"
                                    trend={stats?.participation_trend}
                                    description="Total attempts"
                                />
                                <StatCard
                                    icon={Trophy}
                                    title="Average Score"
                                    value={`${stats?.average_score || 0}%`}
                                    color="purple"
                                    description="Overall performance"
                                />
                                <StatCard
                                    icon={UserCheck}
                                    title="Active Students"
                                    value={stats?.active_students}
                                    color="orange"
                                    description="Last 7 days"
                                />
                            </div>

                            {/* Secondary Stats */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <StatCard
                                    icon={Target}
                                    title="Total Questions"
                                    value={stats?.total_questions}
                                    color="indigo"
                                    description="Across all quizzes"
                                />
                                <StatCard
                                    icon={CheckCircle}
                                    title="Completion Rate"
                                    value={`${stats?.completion_rate || 0}%`}
                                    color="green"
                                    description="Finished attempts"
                                />
                                <StatCard
                                    icon={Clock}
                                    title="Avg Time per Quiz"
                                    value={`${stats?.avg_time_per_quiz || 0}min`}
                                    color="red"
                                    description="Based on recent data"
                                />
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <PerformanceTrendsChart trends={performance_trends} />
                                <QuizDifficultyAnalysis difficultyAnalysis={difficulty_analysis} />
                            </div>

                            {/* Engagement Section */}
                            <StudentEngagement engagementMetrics={engagement_metrics} />

                            {/* Top Quizzes and Recent Participations */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <TopPerformingQuizzes topQuizzes={top_quizzes} />
                                <RecentParticipations participations={recent_participations} />
                            </div>
                        </>
                    )}

                    {activeTab === 'analytics' && (
                        <>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <PerformanceTrendsChart trends={performance_trends} />
                                <QuizDifficultyAnalysis difficultyAnalysis={difficulty_analysis} />
                            </div>
                            <TopPerformingQuizzes topQuizzes={top_quizzes} />
                        </>
                    )}

                    {activeTab === 'engagement' && <StudentEngagement engagementMetrics={engagement_metrics} />}

                    {activeTab === 'quizzes' && <QuizOverview myQuizzes={my_quizzes} />}
                </div>
            </div>
        </AppLayout>
    );
}
