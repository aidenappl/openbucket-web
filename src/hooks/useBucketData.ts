import { useState, useCallback } from 'react';
import { S3ObjectMetadata } from '@/types';
import { reqFetchFolders } from '@/services/folder.service';
import { reqFetchObjects } from '@/services/object.service';

export const useBucketData = () => {
    const [folders, setFolders] = useState<string[] | null>(null);
    const [objects, setObjects] = useState<S3ObjectMetadata[] | null>(null);

    const listFolders = useCallback(async (prefix: string): Promise<string[] | null> => {
        const normalizedPrefix = prefix === "/" ? "" : prefix;
        const response = await reqFetchFolders(normalizedPrefix);
        return response.success ? response.data : null;
    }, []);

    const listObjects = useCallback(async (prefix: string): Promise<S3ObjectMetadata[] | null> => {
        const normalizedPrefix = prefix === "/" ? "" : prefix;
        const response = await reqFetchObjects(normalizedPrefix);
        return response.success ? response.data : null;
    }, []);

    const loadBucketData = useCallback(async (bucket: string, prefix: string, token: string) => {
        if (!bucket || !token) return;

        setFolders(null);
        setObjects(null);

        try {
            const [foldersData, objectsData] = await Promise.all([
                listFolders(prefix),
                listObjects(prefix)
            ]);

            setFolders(foldersData || []);
            setObjects(objectsData || []);
        } catch (error) {
            console.error('Error loading bucket data:', error);
            setFolders([]);
            setObjects([]);
        }
    }, [listFolders, listObjects]);

    return {
        folders,
        objects,
        loadBucketData
    };
};