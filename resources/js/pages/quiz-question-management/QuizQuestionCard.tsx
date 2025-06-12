import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface QuizQuestionCardProps {
    id: number | string;
    quiz_id: number;
    questionData: {
        question: string;
        question_type: 'multiple_choice' | 'identification' | 'checkbox';
        score: number;
        isRequired: boolean;
        isNew?: boolean;
        time?: number;
        choices?: { choice: string; isCorrect: boolean }[];
        correctAnswer?: string;
    };
    onUpdate: (id: number | string, data: any) => Promise<void>;
    onDelete: (id: number | string) => void;
    isNew: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return Object.assign(
        (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        },
        {
            cancel: () => clearTimeout(timeout)
        }
    );
}

const SaveStatusBadge = ({ status }: { status: SaveStatus }) => {
    if (status === 'idle') return null;

    const statusMap = {
        saving: { text: 'Saving...', color: 'text-yellow-500' },
        saved: { text: 'Saved!', color: 'text-green-600' },
        error: { text: 'Error saving', color: 'text-red-600' },
    };

    const { text, color } = statusMap[status];
    return <span className={`text-sm font-semibold ${color}`}>{text}</span>;
};

export default function QuizQuestionCard({
    id,
    quiz_id,
    questionData,
    onUpdate,
    onDelete,
    isNew
}: QuizQuestionCardProps) {
    // Form state - Initialize correctAnswer from choices for identification questions
    const getInitialCorrectAnswer = () => {
        if (questionData.question_type === 'identification') {
            if (questionData.correctAnswer) {
                return questionData.correctAnswer;
            }
            if (questionData.choices?.length > 0) {
                return questionData.choices[0].choice;
            }
        }
        return '';
    };

    const [formData, setFormData] = useState({
        question: questionData.question || '',
        question_type: questionData.question_type || 'multiple_choice' as const,
        score: questionData.score || 1,
        isRequired: questionData.isRequired || false,
        time: questionData.time || 60,
        choices: questionData.choices?.length ? questionData.choices : [{ choice: '', isCorrect: false }],
        correctAnswer: getInitialCorrectAnswer(),
    });

    // UI state
    const [showConfirm, setShowConfirm] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [hasInteracted, setHasInteracted] = useState(false);
    const [lastSavedData, setLastSavedData] = useState<typeof formData>(formData);

    // Helper function to check if data has changed
    const hasDataChanged = (current: typeof formData, saved: typeof formData): boolean => {
        // Deep comparison of form data
        const currentStr = JSON.stringify({
            question: current.question.trim(),
            question_type: current.question_type,
            score: current.score,
            isRequired: current.isRequired,
            time: current.time,
            choices: current.choices,
            correctAnswer: current.correctAnswer.trim(),
        });

        const savedStr = JSON.stringify({
            question: saved.question.trim(),
            question_type: saved.question_type,
            score: saved.score,
            isRequired: saved.isRequired,
            time: saved.time,
            choices: saved.choices,
            correctAnswer: saved.correctAnswer.trim(),
        });

        return currentStr !== savedStr;
    };

    // Create debounced autosave function
    const debouncedAutoSave = useCallback(
        debounce(async (data: typeof formData) => {
            if (!hasInteracted) return;

            // Only autosave if question has content
            const hasContent = data.question.trim() !== '';
            if (!hasContent) return;

            // Check if data has actually changed since last save
            if (!hasDataChanged(data, lastSavedData)) {
                return; // No changes, skip save
            }

            setSaveStatus('saving');

            try {
                // For identification questions, ensure correctAnswer is included in choices format
                let dataToSave = { ...data };
                if (data.question_type === 'identification' && data.correctAnswer) {
                    dataToSave.choices = [{ choice: data.correctAnswer, isCorrect: true }];
                }

                await onUpdate(id, dataToSave);

                // Update last saved data after successful save
                setLastSavedData(data);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 1500);
            } catch (error) {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 2000);
                console.error('Autosave failed:', error);
            }
        }, 1000),
        [id, onUpdate, lastSavedData]
    );

    // Trigger autosave when form data changes
    useEffect(() => {
        if (hasInteracted) {
            debouncedAutoSave(formData);
        }

        return () => {
            debouncedAutoSave.cancel();
        };
    }, [formData, hasInteracted, debouncedAutoSave]);

    // Update form data and mark as interacted
    const updateFormData = (updates: Partial<typeof formData>) => {
        setHasInteracted(true);
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleAddChoice = () => {
        updateFormData({
            choices: [...formData.choices, { choice: '', isCorrect: false }]
        });
    };

    const handleChoiceChange = (index: number, field: 'choice' | 'isCorrect', value: any) => {
        const updated = [...formData.choices];

        if (field === 'isCorrect' && formData.question_type === 'multiple_choice') {
            // Only one can be correct for multiple_choice
            updated.forEach((_, i) => {
                updated[i].isCorrect = i === index ? value : false;
            });
        } else {
            updated[index][field] = value;
        }

        updateFormData({ choices: updated });
    };

    const handleRemoveChoice = (index: number) => {
        const updated = [...formData.choices];
        updated.splice(index, 1);
        updateFormData({ choices: updated });
    };

    const handleManualSave = async () => {
        // Check if there are actually changes to save
        if (!hasDataChanged(formData, lastSavedData)) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1000);
            return; // No changes, just show "saved" status briefly
        }

        setSaveStatus('saving');

        try {
            // For identification questions, ensure correctAnswer is included in choices format
            let dataToSave = { ...formData };
            if (formData.question_type === 'identification' && formData.correctAnswer) {
                dataToSave.choices = [{ choice: formData.correctAnswer, isCorrect: true }];
            }

            await onUpdate(id, dataToSave);

            // Update last saved data after successful save
            setLastSavedData(formData);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
            console.error('Manual save failed:', error);
        }
    };

    const handleDelete = () => {
        setShowConfirm(false);
        onDelete(id);
    };

    return (
        <div className="relative border p-6 rounded-lg shadow-sm">
            <button
                onClick={() => setShowConfirm(true)}
                className="absolute top-4 right-4 text-red-600 hover:text-red-800"
            >
                <X size={18} />
            </button>

            <div className="space-y-4">
                <div>
                    <Label>Question</Label>
                    <Input
                        value={formData.question}
                        onChange={(e) => updateFormData({ question: e.target.value })}
                        placeholder="Enter your question here..."
                    />
                </div>

                <div>
                    <Label>Question Type</Label>
                    <Select
                        value={formData.question_type}
                        onValueChange={(value: any) => {
                            updateFormData({
                                question_type: value,
                                // Reset choices when changing type
                                choices: value === 'identification' ? [] : [{ choice: '', isCorrect: false }],
                                correctAnswer: value === 'identification' ? formData.correctAnswer : ''
                            });
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="identification">Identification</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Score</Label>
                        <Input
                            type="number"
                            min={1}
                            value={formData.score}
                            onChange={(e) => updateFormData({ score: parseInt(e.target.value) || 1 })}
                        />
                    </div>

                    <div>
                        <Label>Time Limit (seconds)</Label>
                        <Input
                            type="number"
                            min={1}
                            value={formData.time}
                            onChange={(e) => updateFormData({ time: parseInt(e.target.value) || 60 })}
                        />
                    </div>
                </div>

                <div>
                    <Label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.isRequired}
                            onChange={(e) => updateFormData({ isRequired: e.target.checked })}
                        />
                        <span>Required</span>
                    </Label>
                </div>

                {/* Multiple Choice and Checkbox Choices */}
                {(formData.question_type === 'multiple_choice' || formData.question_type === 'checkbox') && (
                    <div>
                        <Label>Choices</Label>
                        <div className="space-y-2">
                            {formData.choices.map((choice, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={choice.choice}
                                        onChange={(e) => handleChoiceChange(index, 'choice', e.target.value)}
                                        placeholder={`Choice ${index + 1}`}
                                        className="flex-1"
                                    />
                                    <Label className="flex items-center space-x-1 whitespace-nowrap">
                                        <input
                                            type={formData.question_type === 'multiple_choice' ? 'radio' : 'checkbox'}
                                            name={formData.question_type === 'multiple_choice' ? `correct-${id}` : undefined}
                                            checked={choice.isCorrect}
                                            onChange={(e) => handleChoiceChange(index, 'isCorrect', e.target.checked)}
                                        />
                                        <span>Correct</span>
                                    </Label>
                                    {formData.choices.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveChoice(index)}
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            onClick={handleAddChoice}
                            variant="outline"
                            className="mt-2"
                        >
                            + Add Choice
                        </Button>
                    </div>
                )}

                {/* Identification Answer */}
                {formData.question_type === 'identification' && (
                    <div>
                        <Label>Correct Answer</Label>
                        <Input
                            value={formData.correctAnswer}
                            onChange={(e) => updateFormData({ correctAnswer: e.target.value })}
                            placeholder="Enter the correct answer..."
                        />
                    </div>
                )}

                {/* Save Button and Status */}
                <div className="flex items-center gap-3 pt-2">
                    <Button
                        onClick={handleManualSave}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={saveStatus === 'saving'}
                        data-save-button
                    >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                    </Button>
                    <SaveStatusBadge status={saveStatus} />
                    {isNew && (
                        <span className="text-sm text-blue-600 font-medium">New</span>
                    )}
                    {!hasDataChanged(formData, lastSavedData) && hasInteracted && (
                        <span className="text-sm text-gray-500 font-medium">No changes</span>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Question?</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            Are you sure you want to delete this question? This action cannot be undone.
                        </p>
                        <div className="mt-4 flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Yes, delete
                            </Button>
                        </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}
