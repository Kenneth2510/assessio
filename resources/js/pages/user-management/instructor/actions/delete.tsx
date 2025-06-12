import MySwal from '@/components/swal-alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

type DeleteInstructorProps = {
    id: number;
    name: string;
    email: string;
    status: string;
};

export default function DeleteInstructor({ instructor }: DeleteInstructorProps) {
    const { delete: destroy, processing, errors } = useForm();
    const [open, setOpen] = useState(false);

    function handleInstructorDelete(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setOpen(false);

        MySwal.fire({
            title: <p>Deleting {instructor.name}...</p>,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                MySwal.showLoading();
            },
        });

        destroy(route('instructor.destroy', instructor), {
            onSuccess: () => {
                MySwal.fire({
                    icon: 'success',
                    title: 'Deleted successfully!',
                    timer: 1500,
                    showConfirmButton: false,
                });
            },
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
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <button className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-muted focus:outline-none">
                    <Trash2 className="text-red-500" />
                    <span className="mx-3">Delete</span>
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete {instructor.name}.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleInstructorDelete} disabled={processing}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
