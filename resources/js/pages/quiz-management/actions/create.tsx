import MySwal from '@/components/swal-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

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
        title: 'Create',
        href: '/quiz-management/create',
    },
];

export default function CreateQuiz() {
    type QuizFormData = {
        title: string;
        description: string;
        mode: string;
    };

    const { data, setData, post, processing, errors } = useForm<QuizFormData>({
        title: '',
        description: '',
        mode: '',
    });

    function handleQuizSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        MySwal.fire({
            title: <p>Submitting...</p>,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                MySwal.showLoading();
            },
        });

        post(route('quiz-management.index'), {
            onError: () => {
                MySwal.fire({
                    icon: 'error',
                    title: 'Error processing request',
                    showCloseButton: true,
                });
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Quiz" />
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
                                <CardTitle>Create Quiz</CardTitle>
                                <CardDescription>Create a new Quiz</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid-w-full item-center gap-4">
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Quiz Title</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Quiz Title"
                                            required
                                        />
                                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                                    </div>
                                    <div className="5 mt-5 flex flex-col space-y-1">
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
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Submitting' : 'Submit'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
