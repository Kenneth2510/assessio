import MySwal from '@/components/swal-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface SkillTag {
    id: number;
    tag_title: string;
    description: string;
}

interface Quiz {
    id: number;
    title: string;
    description: string;
    mode: string;
    skill_tags: SkillTag[];
}

interface EditQuizProps {
    quiz: Quiz;
    skillTags: SkillTag[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Quiz Management',
        href: '/quiz-management',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function EditQuiz({ quiz, skillTags }: EditQuizProps) {
    type QuizFormData = {
        title: string;
        description: string;
        mode: string;
        skill_tag_ids: number[];
    };

    const { data, setData, put, processing, errors } = useForm<QuizFormData>({
        title: quiz.title,
        description: quiz.description,
        mode: quiz.mode,
        skill_tag_ids: quiz.skill_tags.map(tag => tag.id),
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Filter skill tags based on search term
    const filteredSkillTags = skillTags.filter(tag =>
        tag.tag_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function handleQuizSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        MySwal.fire({
            title: <p>Updating...</p>,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                MySwal.showLoading();
            },
        });

        put(route('quiz-management.update', quiz.id), {
            onError: () => {
                MySwal.fire({
                    icon: 'error',
                    title: 'Error processing request',
                    showCloseButton: true,
                });
            },
        });
    }

    function handleSkillTagChange(tagId: number, checked: boolean) {
        if (checked) {
            setData('skill_tag_ids', [...data.skill_tag_ids, tagId]);
        } else {
            setData('skill_tag_ids', data.skill_tag_ids.filter(id => id !== tagId));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Quiz" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <Button asChild>
                        <Link href={route('quiz-management.index')}>Back</Link>
                    </Button>
                </div>
                <div>
                    <Card>
                        <form onSubmit={handleQuizSubmit} className="space-y-4">
                            <CardHeader>
                                <CardTitle>Edit Quiz</CardTitle>
                                <CardDescription>Update quiz details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid w-full items-center gap-4">
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="title">Quiz Title</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Quiz Title"
                                            required
                                        />
                                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                                    </div>

                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="mode">Quiz Mode</Label>
                                        <Select value={data.mode} onValueChange={(value) => setData('mode', value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Quiz Mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Quiz Mode</SelectLabel>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="focused">Focused</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.mode && <p className="mt-1 text-sm text-red-500">{errors.mode}</p>}
                                    </div>

                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="description">Quiz Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Quiz Description"
                                            required
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                    </div>

                                    <div className="mt-5 flex flex-col space-y-3">
                                        <Label>Skill Tags</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Select the skills that this quiz will assess
                                        </p>

                                        {/* Search Input */}
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search skill tags..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>

                                        {/* Selected Tags Count */}
                                        {data.skill_tag_ids.length > 0 && (
                                            <div className="text-sm text-muted-foreground">
                                                {data.skill_tag_ids.length} skill tag{data.skill_tag_ids.length !== 1 ? 's' : ''} selected
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                                            {filteredSkillTags.length > 0 ? (
                                                filteredSkillTags.map((tag) => (
                                                    <div key={tag.id} className="flex items-start space-x-3 rounded-lg border p-3">
                                                        <Checkbox
                                                            id={`skill-tag-${tag.id}`}
                                                            checked={data.skill_tag_ids.includes(tag.id)}
                                                            onCheckedChange={(checked) =>
                                                                handleSkillTagChange(tag.id, checked as boolean)
                                                            }
                                                        />
                                                        <div className="grid gap-1.5 leading-none">
                                                            <Label
                                                                htmlFor={`skill-tag-${tag.id}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                            >
                                                                {tag.tag_title}
                                                            </Label>
                                                            <p className="text-xs text-muted-foreground">
                                                                {tag.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                                                    No skill tags found matching "{searchTerm}"
                                                </div>
                                            )}
                                        </div>

                                        {errors.skill_tag_ids && (
                                            <p className="mt-1 text-sm text-red-500">{errors.skill_tag_ids}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Quiz'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
