import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    Target,
    UserCheck,
    Crown,
    GraduationCap,
    Heart,
    TrendingUp,
    Award,
    Calendar,
    Clock,
    Star
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const breadcrumbs = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
        cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
        sky: "bg-sky-50 text-sky-700 border-sky-200"
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
                <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

// Trend Chart Component
const TrendChart = ({ data, title, dataKey, color = "#3B82F6" }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                    }}
                />
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={3}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

// Top Performers Component
const TopPerformers = ({ learners, instructors }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Learners */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <Award className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">🌟 XP Champions (Last 30 Days)</h3>
            </div>
            <div className="space-y-3">
                {learners?.slice(0, 5).map((learner, index) => (
                    <div key={learner.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">{learner.name}</p>
                                <p className="text-sm text-gray-600">{learner.quizzes_completed} quizzes • {Math.round(learner.average_score)}% avg</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-blue-600">{learner.total_xp} XP</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Top Instructors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <Crown className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">👑 Quiz Masters</h3>
            </div>
            <div className="space-y-3">
                {instructors?.slice(0, 5).map((instructor, index) => (
                    <div key={instructor.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-indigo-500' : 'bg-blue-500'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">{instructor.name}</p>
                                <p className="text-sm text-gray-600">{instructor.total_participations} participations</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-indigo-600">{instructor.quizzes_count} quizzes</p>
                            <p className="text-sm text-gray-600">{instructor.total_questions} questions</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Recent Activity Component
const RecentActivity = ({ quizzes, participations }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <BookOpen className="h-5 w-5 text-cyan-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">📚 Fresh Quizzes</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {quizzes?.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">{quiz.title}</p>
                            <p className="text-sm text-gray-600">by {quiz.creator?.name}</p>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{quiz.mode}</span>
                                <span className="text-xs text-gray-500">{quiz.questions_count} questions</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">{new Date(quiz.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Participations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">🎯 Latest Attempts</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {participations?.map((participation) => (
                    <div key={participation.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">{participation.user?.name}</p>
                            <p className="text-sm text-gray-600">{participation.quiz?.title}</p>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    participation.percentage >= 80 ? 'bg-green-100 text-green-800' :
                                    participation.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {Math.round(participation.percentage)}%
                                </span>
                                <span className="text-xs text-gray-500">+{participation.xp_earned} XP</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{participation.total_score}</p>
                            <p className="text-xs text-gray-500">{participation.time_taken}min</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Skill Tags Distribution
const SkillTagsChart = ({ skillTags }) => {
    const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#84CC16'];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <Star className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">🏷️ Popular Skills</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={skillTags}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            label={({ tag_title, percent }) => `${tag_title} ${(percent * 100).toFixed(0)}%`}
                        >
                            {skillTags?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                    {skillTags?.map((tag, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded-full mr-3"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <div>
                                    <p className="font-medium text-gray-900">{tag.tag_title}</p>
                                    <p className="text-xs text-gray-600">{tag.description}</p>
                                </div>
                            </div>
                            <span className="font-bold text-gray-700">{tag.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Mode Performance Chart
const ModePerformanceChart = ({ modeDistribution, averageScores }) => {
    const chartData = Object.entries(modeDistribution || {}).map(([mode, count]) => ({
        mode,
        count,
        avgScore: averageScores?.[mode] || 0
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">🎮 Quiz Mode Analytics</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mode" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px'
                        }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" name="Quiz Count" />
                    <Bar dataKey="avgScore" fill="#8B5CF6" name="Avg Score" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default function Dashboard({
    stats,
    user_roles,
    quiz_mode_distribution,
    skill_tags_distribution,
    recent_quizzes,
    recent_participations,
    top_learners_by_xp,
    top_instructors_by_quizzes,
    quiz_creation_trend,
    participation_trend,
    average_scores_by_mode
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 bg-gray-50">

                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                    <h1 className="text-2xl font-bold mb-2">Welcome back, Admin! 👋</h1>
                    <p className="text-blue-100">Here's what's happening in your learning universe today</p>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={Users}
                        title="Total Users"
                        value={stats?.total_users}
                        subtitle="Growing community"
                        color="blue"
                    />
                    <StatCard
                        icon={BookOpen}
                        title="Total Quizzes"
                        value={stats?.total_quizzes}
                        subtitle="Knowledge adventures"
                        color="indigo"
                    />
                    <StatCard
                        icon={Target}
                        title="Quiz Attempts"
                        value={stats?.total_participations}
                        subtitle="Learning moments"
                        color="cyan"
                    />
                    <StatCard
                        icon={UserCheck}
                        title="Active Users"
                        value={stats?.active_users}
                        subtitle="Ready to learn"
                        color="sky"
                    />
                </div>

                {/* User Roles Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        icon={Crown}
                        title="Admins"
                        value={user_roles?.admins}
                        subtitle="The masterminds"
                        color="blue"
                    />
                    <StatCard
                        icon={GraduationCap}
                        title="Instructors"
                        value={user_roles?.instructors}
                        subtitle="Knowledge creators"
                        color="indigo"
                    />
                    <StatCard
                        icon={Heart}
                        title="Learners"
                        value={user_roles?.learners}
                        subtitle="Future heroes"
                        color="cyan"
                    />
                </div>

                {/* Trend Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart
                        data={quiz_creation_trend}
                        title="📈 Quiz Creation Trend"
                        dataKey="count"
                        color="#3B82F6"
                    />
                    <TrendChart
                        data={participation_trend}
                        title="🎯 Participation Trend"
                        dataKey="count"
                        color="#8B5CF6"
                    />
                </div>

                {/* Top Performers */}
                <TopPerformers
                    learners={top_learners_by_xp}
                    instructors={top_instructors_by_quizzes}
                />

                {/* Quiz Mode Performance */}
                <ModePerformanceChart
                    modeDistribution={quiz_mode_distribution}
                    averageScores={average_scores_by_mode}
                />

                {/* Skill Tags Distribution */}
                <SkillTagsChart skillTags={skill_tags_distribution} />

                {/* Recent Activity */}
                <RecentActivity
                    quizzes={recent_quizzes}
                    participations={recent_participations}
                />

                {/* Footer */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                    <p className="text-gray-600">
                        💙 Made with love for learning • Keep inspiring minds!
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
