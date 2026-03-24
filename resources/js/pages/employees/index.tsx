import { Head, router, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageCropper from '@/components/image-cropper';
import AppLayout from '@/layouts/app-layout';
import employees from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

interface Task {
    id: number;
    title: string;
    description: string;
    due_at: string | null;
}

interface Employee {
    id: number;
    full_name: string;
    mobile: string;
    photo_url?: string | null;
    tasks: Task[];
}

interface Props {
    employees: Employee[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: employees.index().url,
    },
];

export default function Index({ employees: employeeList }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
        null,
    );
    const [deleteError, setDeleteError] = useState<string>('');
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    const { data: employeeData, setData: setEmployeeData, post: postEmployee, processing: processingEmployee, reset: resetEmployee, errors: employeeErrors, transform } = useForm({
        full_name: '',
        mobile: '',
        photo: null as File | null,
    });

    const openCreateModal = () => {
        setEditingEmployee(null);
        setDeleteError('');
        setEmployeeData('full_name', '');
        setEmployeeData('mobile', '');
        setEmployeeData('photo', null);
        setPreviewPhoto(null);
        resetEmployee();
        setModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setDeleteError('');
        setEmployeeData('full_name', employee.full_name);
        setEmployeeData('mobile', employee.mobile);
        setEmployeeData('photo', null);
        setPreviewPhoto(employee.photo_url || null);
        setModalOpen(true);
    };

    const submitEmployee: FormEventHandler = (e) => {
        e.preventDefault();

        const onSuccess = () => {
            resetEmployee();
            setModalOpen(false);
            setEditingEmployee(null);
        };

        if (editingEmployee) {
            transform((data) => ({
                ...data,
                _method: 'patch',
            }));
            postEmployee(`/employees/${editingEmployee.id}`, {
                forceFormData: true,
                onSuccess,
            });
        } else {
            transform((data) => data);
            postEmployee(employees.store().url, {
                forceFormData: true,
                onSuccess,
            });
        }
    };

    const deleteEmployee = (employee: Employee) => {
        setDeleteError('');

        router.delete(`/employees/${employee.id}`, {
            onSuccess: () => {
                setModalOpen(false);
            },
            onError: (errors) => {
                setDeleteError(
                    (errors.delete as string) ||
                        'Cannot delete employee with assigned tasks.',
                );
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees & Tasks" />
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Employees</h2>
                    <Button type="button" onClick={openCreateModal}>Add an Employee</Button>
                </div>

                {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                )}

                {/* Employees and Tasks List */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {employeeList.map((employee) => (
                            <Card key={employee.id}>
                                <CardHeader>
                                    <div className="mb-2">
                                        <img
                                            src={employee.photo_url || 'https://placehold.co/80x80?text=No+Photo'}
                                            alt={employee.full_name}
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                    </div>
                                    <CardTitle>{employee.full_name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{employee.mobile}</p>
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => openEditModal(employee)}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={(open) => {
                if (!open) {
                    setPreviewPhoto(null);
                    setSelectedFile(null);
                }
                setModalOpen(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmployee
                                ? 'Edit Employee'
                                : 'Add an Employee'}
                        </DialogTitle>
                        <DialogDescription>
                            Enter employee details below.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEmployee} className="space-y-4">
                        <div>
                            <Label htmlFor="full_name">Full name</Label>
                            <Input
                                id="full_name"
                                value={employeeData.full_name}
                                onChange={(e) =>
                                    setEmployeeData('full_name', e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={employeeErrors.full_name}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="mobile">Contact number</Label>
                            <Input
                                id="mobile"
                                value={employeeData.mobile}
                                onChange={(e) =>
                                    setEmployeeData('mobile', e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={employeeErrors.mobile}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="photo">Photo upload</Label>
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);
                                        setCropperOpen(true);
                                    }
                                }}
                            />
                            {previewPhoto && (
                                <div className="mt-3">
                                    <img
                                        src={previewPhoto}
                                        alt="Preview"
                                        className="h-32 w-32 rounded-full object-cover border-2 border-primary"
                                    />
                                </div>
                            )}
                            <InputError
                                message={employeeErrors.photo}
                                className="mt-2"
                            />
                        </div>

                        <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
                            <div className="flex justify-start">
                                {editingEmployee && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => deleteEmployee(editingEmployee)}
                                    >
                                        Delete Employee
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processingEmployee}>
                                    {editingEmployee
                                        ? 'Save changes'
                                        : 'Add Employee'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ImageCropper
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                imageFile={selectedFile}
                onCrop={(croppedFile) => {
                    setEmployeeData('photo', croppedFile);
                    // Create preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setPreviewPhoto(e.target?.result as string);
                    };
                    reader.readAsDataURL(croppedFile);
                    setSelectedFile(null);
                }}
            />
        </AppLayout>
    );
}
