import MySwal from '@/components/swal-alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { columns, type Admin } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'User Management - Admin',
        href: '/user-management/admin',
    },
];

type AdminProps = {
    admins: Admin[];
};

export default function Dashboard({ admins }: AdminProps) {
    const { props } = usePage();
    const successMessage = props.flash?.success;

    useEffect(() => {
        if (successMessage) {
            MySwal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                timer: 2000,
                showConfirmButton: false,
            });
        }
    }, [successMessage]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="container mx-auto py-10">
                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-800 dark:text-white">Admin Management</h1>
                    <DataTable columns={columns} data={admins} />
                </div>
            </div>
        </AppLayout>
    );
}
