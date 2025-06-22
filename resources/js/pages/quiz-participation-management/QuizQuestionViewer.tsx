import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Square, Type } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
    question: {
        id: number;
        question: string;
        question_type: 'multiple_choice' | 'checkbox' | 'identification';
        choices?: { choice: string; isCorrect: boolean }[];
    };
    answer: any;
    onAnswer: (answer: any) => void;
}

export default function QuizQuestionViewer({ question, answer, onAnswer }: Props) {
    const [localAnswer, setLocalAnswer] = useState(answer);

    // Sync local state with prop changes
    useEffect(() => {
        setLocalAnswer(answer);
    }, [answer]);

    const handleAnswerChange = (newAnswer: any) => {
        setLocalAnswer(newAnswer);
        onAnswer(newAnswer);
    };

    const questionTypeIcons = {
        multiple_choice: <Circle className="h-4 w-4" />,
        checkbox: <Square className="h-4 w-4" />,
        identification: <Type className="h-4 w-4" />
    };

    const questionTypeLabels = {
        multiple_choice: 'Single Choice',
        checkbox: 'Multiple Choice',
        identification: 'Text Answer'
    };

    const isAnswered = localAnswer !== undefined && localAnswer !== '' &&
                     (Array.isArray(localAnswer) ? localAnswer.length > 0 : true);

    return (
        <Card className="w-full">
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className="flex items-center gap-1">
                                    {questionTypeIcons[question.question_type]}
                                    {questionTypeLabels[question.question_type]}
                                </Badge>
                                {isAnswered && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Answered
                                    </Badge>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                                {question.question}
                            </h3>
                        </div>
                    </div>

                    {/* Answer Section */}
                    <div className="space-y-4">
                        {question.question_type === 'identification' && (
                            <div className="space-y-2">
                                <Label htmlFor="identification" className="text-sm font-medium text-gray-700">
                                    Your Answer
                                </Label>
                                <Textarea
                                    id="identification"
                                    placeholder="Enter your answer here..."
                                    className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    value={localAnswer || ''}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                />
                                <div className="text-xs text-gray-500">
                                    {localAnswer ? `${localAnswer.length} characters` : 'No answer provided'}
                                </div>
                            </div>
                        )}

                        {question.question_type === 'multiple_choice' && question.choices && (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">
                                    Select one option:
                                </Label>
                                <RadioGroup
                                    value={localAnswer || ''}
                                    onValueChange={handleAnswerChange}
                                    className="space-y-3"
                                >
                                    {question.choices.map((choice, idx) => (
                                        <div key={`${question.id}-choice-${idx}`} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                            <RadioGroupItem
                                                value={choice.choice}
                                                id={`${question.id}-option-${idx}`}
                                                className="mt-0.5 border-blue-500 text-blue-600"
                                            />
                                            <Label
                                                htmlFor={`${question.id}-option-${idx}`}
                                                className="flex-1 text-sm text-gray-800 leading-relaxed cursor-pointer"
                                            >
                                                {choice.choice}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        {question.question_type === 'checkbox' && question.choices && (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">
                                    Select all that apply:
                                </Label>
                                <div className="space-y-3">
                                    {question.choices.map((choice, idx) => {
                                        const currentAnswers = Array.isArray(localAnswer) ? localAnswer : [];
                                        const isChecked = currentAnswers.includes(choice.choice);

                                        return (
                                            <div key={`${question.id}-checkbox-${idx}`} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                                <Checkbox
                                                    id={`${question.id}-checkbox-${idx}`}
                                                    className="mt-0.5 border-blue-500 text-blue-600"
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            handleAnswerChange([...currentAnswers, choice.choice]);
                                                        } else {
                                                            handleAnswerChange(currentAnswers.filter((a: string) => a !== choice.choice));
                                                        }
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`${question.id}-checkbox-${idx}`}
                                                    className="flex-1 text-sm text-gray-800 leading-relaxed cursor-pointer"
                                                >
                                                    {choice.choice}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {Array.isArray(localAnswer) && localAnswer.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        {localAnswer.length} option{localAnswer.length > 1 ? 's' : ''} selected
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
