import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { reqDeleteFolder, reqPostFolder } from '@/services/folder.service';
import { reqDeleteObject } from '@/services/object.service';

export const useBucketActions = () => {
    const deleteFolder = useCallback(async (folderPath: string): Promise<boolean> => {
        const confirmDelete = confirm(
            `Are you sure you want to delete the folder "${folderPath}"? This action cannot be undone.`
        );
        if (!confirmDelete) {
            return false;
        }

        const response = await reqDeleteFolder(folderPath);

        if (response.success) {
            return true;
        } else {
            console.error("Failed to delete folder:", response);
            toast.error("Failed to delete folder");
            return false;
        }
    }, []);

    const deleteObject = useCallback(async (objectKey: string): Promise<boolean> => {
        const confirmDelete = confirm(
            `Are you sure you want to delete the object "${objectKey}"? This action cannot be undone.`
        );
        if (!confirmDelete) {
            return false;
        }

        const response = await reqDeleteObject(objectKey);

        if (response.success) {
            return true;
        } else {
            console.error("Failed to delete object:", response);
            toast.error("Failed to delete object");
            return false;
        }
    }, []);

    const createFolder = useCallback(async (folderName: string): Promise<boolean> => {
        if (folderName.trim() === "") {
            toast.error("Folder name cannot be empty.");
            return false;
        }

        const response = await reqPostFolder(folderName);
        if (response.success) {
            return true;
        } else {
            console.error("Failed to create folder:", response);
            toast.error("Failed to create folder");
            return false;
        }
    }, []);

    const deleteBulkItems = useCallback(async (
        folders: string[],
        objects: string[],
        onRefresh?: () => void
    ) => {
        if (folders.length === 0 && objects.length === 0) {
            toast.error("No items selected for deletion.");
            return;
        }

        const deletePromises = [
            ...folders.map(folder => deleteFolder(folder)),
            ...objects.map(object => deleteObject(object))
        ];

        try {
            await Promise.all(deletePromises);
            onRefresh?.();
        } catch (error) {
            console.error("Error during bulk deletion:", error);
        }
    }, [deleteFolder, deleteObject]);

    return {
        deleteFolder,
        deleteObject,
        createFolder,
        deleteBulkItems
    };
};