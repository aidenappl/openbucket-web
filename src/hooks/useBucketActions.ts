import { useCallback } from 'react';
import { fetchApi } from '@/tools/axios.tools';
import toast from 'react-hot-toast';

export const useBucketActions = () => {
    const deleteFolder = useCallback(async (bucket: string, folderPath: string, token: string): Promise<boolean> => {
        const confirmDelete = confirm(
            `Are you sure you want to delete the folder "${folderPath}"? This action cannot be undone.`
        );
        if (!confirmDelete) {
            return false;
        }

        const response = await fetchApi(
            {
                url: `/${bucket}/folder`,
                method: "DELETE",
                params: { folder: folderPath },
            },
            token
        );

        if (response.success) {
            return true;
        } else {
            console.error("Failed to delete folder:", response);
            toast.error("Failed to delete folder");
            return false;
        }
    }, []);

    const deleteObject = useCallback(async (bucket: string, objectKey: string, token: string): Promise<boolean> => {
        const confirmDelete = confirm(
            `Are you sure you want to delete the object "${objectKey}"? This action cannot be undone.`
        );
        if (!confirmDelete) {
            return false;
        }

        const response = await fetchApi(
            {
                url: `/${bucket}/object`,
                method: "DELETE",
                params: { key: objectKey },
            },
            token
        );

        if (response.success) {
            return true;
        } else {
            console.error("Failed to delete object:", response);
            toast.error("Failed to delete object");
            return false;
        }
    }, []);

    const createFolder = useCallback(async (bucket: string, folderName: string, token: string): Promise<boolean> => {
        if (folderName.trim() === "") {
            toast.error("Folder name cannot be empty.");
            return false;
        }

        const response = await fetchApi(
            {
                url: `/${bucket}/folder`,
                method: "POST",
                data: { folder: folderName },
            },
            token
        );

        if (response.success) {
            return true;
        } else {
            console.error("Failed to create folder:", response);
            toast.error("Failed to create folder");
            return false;
        }
    }, []);

    const deleteBulkItems = useCallback(async (
        bucket: string,
        folders: string[],
        objects: string[],
        token: string,
        onRefresh?: () => void
    ) => {
        if (folders.length === 0 && objects.length === 0) {
            toast.error("No items selected for deletion.");
            return;
        }

        const deletePromises = [
            ...folders.map(folder => deleteFolder(bucket, folder, token)),
            ...objects.map(object => deleteObject(bucket, object, token))
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