import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Award,
    CheckSquare,
    Circle,
    Type,
    Brain
} from 'lucide-react';

interface QuizResultsAnalyticsProps {
    results: {
        percentage: number;
        total_questions: number;
        correct_answers: number;
    };
    type_analysis: Record<string, {
        total: number;
        correct: number;
        percentage: number;
        type_label: string;
    }>;
    performance: {
        strengths: string[];
        areas_for_improvement: string[];
        performance_level: string;
    };
    xp_breakdown: any;
}

export default function QuizResultsAnalytics({
    results,
    type_analysis,
    performance,
    xp_breakdown
}: QuizResultsAnalyticsProps) {
    const questionTypeIcons = {
        'Multiple Choice': <Circle className="h-4 w-4" />,
        'Checkbox': <CheckSquare className="h-4 w-4" />,
        'Identification': <Type className="h-4 w-4" />
    };

    const getPerformanceColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Question Type Analysis */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Performance by Question Type
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(type_analysis).map(([type, data]) => (
                        <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {questionTypeIcons[data.type_label] || <Brain className="h-4 w-4" />}
                                    <span className="font-medium text-gray-700">{data.type_label}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {data.correct}/{data.total}
                                    </Badge>
                                </div>
                                <span className="text-sm font-bold">{data.percentage}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Progress value={data.percentage} className="flex-1 h-2" />
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(data.percentage)}`}>
                                    {data.percentage >= 80 ? 'Strong' :
                                     data.percentage >= 60 ? 'Good' : 'Needs Work'}
                                </div>
                            </div>
                        </div>
                    ))}

                    {Object.keys(type_analysis).length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                            No question type analysis available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Strengths and Areas for Improvement */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        Performance Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Strengths */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-green-700">Strengths</h4>
                        </div>
                        {performance.strengths.length > 0 ? (
                            <div className="space-y-2">
                                {performance.strengths.map((strength, index) => (
                                    <Badge key={index} className="mr-2 mb-2 bg-green-100 text-green-800 hover:bg-green-200">
                                        {strength}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Continue practicing to identify your strengths
                            </p>
                        )}
                    </div>

                    {/* Areas for Improvement */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold text-orange-700">Areas for Improvement</h4>
                        </div>
                        {performance.areas_for_improvement.length > 0 ? (
                            <div className="space-y-2">
                                {performance.areas_for_improvement.map((area, index) => (
                                    <Badge key={index} variant="outline" className="mr-2 mb-2 border-orange-300 text-orange-700">
                                        {area}
                                    </Badge>
                                ))}
                                <p className="text-sm text-gray-600 mt-2">
                                    Focus on these areas to improve your performance
                                </p>
                            </div>
                        ) : (
                            <div className="text-sm text-green-600">
                                Great job! No specific areas need improvement.
                            </div>
                        )}
                    </div>

                    {/* Overall Performance Summary */}
                    <div className="pt-4 border-t">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-800">Overall Assessment</span>
                            </div>
                            <p className="text-sm text-blue-700">
                                {results.percentage >= 90 && "Outstanding performance! You've mastered this material."}
                                {results.percentage >= 80 && results.percentage < 90 && "Excellent work! You have a solid understanding of the material."}
                                {results.percentage >= 70 && results.percentage < 80 && "Good job! You understand most concepts with room for improvement."}
                                {results.percentage >= 60 && results.percentage < 70 && "You're on the right track. Focus on the areas highlighted above."}
                                {results.percentage < 60 && "Consider reviewing the material and practicing more before retaking."}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* XP Breakdown (if available) */}
            {xp_breakdown && (
                <Card className="shadow-lg lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-purple-600" />
                            Experience Points Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-sm text-purple-600 font-medium">Base XP</div>
                                <div className="text-2xl font-bold text-purple-900">
                                    {xp_breakdown.base_xp || 0}
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-sm text-green-600 font-medium">Bonus XP</div>
                                <div className="text-2xl font-bold text-green-900">
                                    {xp_breakdown.bonus_xp || 0}
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-sm text-blue-600 font-medium">Total XP</div>
                                <div className="text-2xl font-bold text-blue-900">
                                    {results.xp_earned}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
