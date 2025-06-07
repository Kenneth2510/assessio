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

type DeleteQuizProps = {
    id: number;
    title: string;
    description: string;
    mode: string;
};

export default function DeleteQuiz({ quiz }: DeleteQuizProps) {
    const { delete: destroy, processing, errors } = useForm();
    const [open, setOpen] = useState(false);

    function handleQuizDelete(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        MySwal.fire({
            title: <p>Deleting {quiz.title}...</p>,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                MySwal.showLoading();
            },
        });

        destroy(route('quiz-management.destroy', quiz), {
            onSuccess: () => {
                MySwal.fire({
                    icon: 'success',
                    title: 'Deleted successfully!',
                    timer: 1500,
                    showConfirmButton: false,
                });
                setOpen(false); // ✅ Close the dialog on success
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
                    <AlertDialogDescription>This will permanently delete {quiz.title}.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleQuizDelete} disabled={processing}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
