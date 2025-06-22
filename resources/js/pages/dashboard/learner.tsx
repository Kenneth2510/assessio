import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Award, Clock, TrendingUp, Star, Target } from 'lucide-react';

const breadcrumbs = [
    {
        title: 'Learner Dashboard',
        href: '/learner/dashboard',
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

// XP History Component
const XpHistory = ({ xpHistory }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ XP History</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
            {xpHistory.map((entry, index) => (
                <div key={index} className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                        <p className="text-xs text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold text-blue-700">{entry.xp_earned} XP</p>
                </div>
            ))}
        </div>
    </div>
);

// Quiz Participation History
const MyParticipations = ({ participations }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Recent Quiz Attempts</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
            {participations.map((attempt) => (
                <div key={attempt.id} className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900">{attempt.quiz?.title}</p>
                        <p className="text-sm text-gray-600">by {attempt.quiz?.creator?.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-700">Score: {attempt.total_score}%</p>
                        <p className="text-xs text-gray-500">{attempt.status}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Available Quizzes
const AvailableQuizzes = ({ quizzes }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Available Quizzes</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
            {quizzes.map((quiz) => (
                <div key={quiz.id} className="flex justify-between items-center bg-cyan-50 p-3 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900">{quiz.title}</p>
                        <p className="text-sm text-gray-600">by {quiz.creator?.name}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{quiz.mode}</span>
                            <span className="text-xs text-gray-500">{quiz.questions_count} questions</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <a href={`/quiz/${quiz.id}`} className="text-sm font-bold text-blue-600 hover:underline">Take Quiz</a>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Achievements
const Achievements = ({ achievements }) => (
    <div className="bg-white rounded-xl border border-yellow-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Recent Achievements</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
            {achievements.map((attempt) => (
                <div key={attempt.id} className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg">
                    <div>
                        <p className="font-medium text-yellow-800">{attempt.quiz?.title}</p>
                        <p className="text-sm text-gray-600">Score: {attempt.total_score}%</p>
                    </div>
                    <div className="text-right text-yellow-600 font-bold">{attempt.xp_earned} XP</div>
                </div>
            ))}
        </div>
    </div>
);

export default function Dashboard() {
    const {
        stats,
        my_participations,
        available_quizzes,
        xp_history,
        recent_achievements,
    } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 bg-gray-50">

                {/* Welcome Message */}
                <div className="bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl p-6 text-white">
                    <h1 className="text-2xl font-bold mb-2">Welcome back, Learner! 📚</h1>
                    <p className="text-cyan-100">Track your progress and keep leveling up</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={BookOpen}
                        title="Quizzes Taken"
                        value={stats?.total_quizzes_taken}
                        subtitle="Great job!"
                        color="blue"
                    />
                    <StatCard
                        icon={Clock}
                        title="Completed Quizzes"
                        value={stats?.completed_quizzes}
                        subtitle="You're getting there"
                        color="indigo"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="XP Earned"
                        value={stats?.total_xp_earned}
                        subtitle="Keep earning"
                        color="cyan"
                    />
                    <StatCard
                        icon={Star}
                        title="Average Score"
                        value={`${stats?.average_score ?? 0}%`}
                        subtitle="Aim for 100%"
                        color="sky"
                    />
                </div>

                {/* Main Content Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <XpHistory xpHistory={xp_history} />
                    <MyParticipations participations={my_participations} />
                    <AvailableQuizzes quizzes={available_quizzes} />
                </div>

                {/* Achievements */}
                <Achievements achievements={recent_achievements} />

                {/* Footer */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                    <p className="text-gray-600">🔥 Keep pushing forward. Every quiz makes you stronger!</p>
                </div>
            </div>
        </AppLayout>
    );
}
