import MySwal from '@/components/swal-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

type Learner = {
    id: number;
    name: string;
    email: string;
    status: string;
    password: string;
};

type EditLearnerProps = {
    learner: Learner;
};

export default function EditLearner({ learner }: EditLearnerProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'User Management - Learner',
            href: '/user-management/learner',
        },
        {
            title: 'Edit',
            href: `/user-management/learner/${learner.id}/edit`,
        },
    ];

    type LearnerFormData = {
        status: string;
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    };

    const { data, setData, put, processing, errors } = useForm<LearnerFormData>({
        name: learner.name,
        email: learner.email,
        password: '',
        password_confirmation: '',
        status: learner.status,
    });

    function handleLearnerSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        MySwal.fire({
            title: <p>Submitting...</p>,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                MySwal.showLoading();
            },
        });

        put(route('learner.update', learner.id), {
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
            <Head title="Edit Learner" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <Button asChild>
                        <Link href={route('learner.index')}>Back</Link>
                    </Button>
                </div>
                <div>
                    <Card>
                        <form onSubmit={handleLearnerSubmit} className="space-y-4">
                            <CardHeader>
                                <CardTitle>Edit Learner</CardTitle>
                                <CardDescription>Edit Learner</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid-w-full item-center gap-4">
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="status">Status</Label>
                                        <RadioGroup defaultValue={data.status} onValueChange={(value) => setData('status', value)} className="flex">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="active" id="active" />
                                                <Label htmlFor="active">Active</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="inactive" id="inactive" />
                                                <Label htmlFor="inactive">Inactive</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="name"
                                            required
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                    </div>
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="email"
                                            required
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="password"
                                        />
                                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                    </div>
                                    <div className="mt-5 flex flex-col space-y-1.5">
                                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="password"
                                        />
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
