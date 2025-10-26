import { useState, useCallback } from 'react';
import { fetchApi } from '@/tools/axios.tools';
import { S3ObjectMetadata } from '@/types';

export const useBucketData = () => {
    const [folders, setFolders] = useState<string[] | null>(null);
    const [objects, setObjects] = useState<S3ObjectMetadata[] | null>(null);

    const listFolders = useCallback(async (bucket: string, prefix: string, token: string): Promise<string[] | null> => {
        const normalizedPrefix = prefix === "/" ? "" : prefix;
        const response = await fetchApi<string[]>(
            {
                url: `/${bucket}/folders`,
                method: "GET",
                params: { prefix: normalizedPrefix },
            },
            token
        );
        return response.success ? response.data : null;
    }, []);

    const listObjects = useCallback(async (bucket: string, prefix: string, token: string): Promise<S3ObjectMetadata[] | null> => {
        const normalizedPrefix = prefix === "/" ? "" : prefix;
        const response = await fetchApi<S3ObjectMetadata[]>(
            {
                url: `/${bucket}/objects`,
                method: "GET",
                params: { prefix: normalizedPrefix },
            },
            token
        );
        return response.success ? response.data : null;
    }, []);

    const loadBucketData = useCallback(async (bucket: string, prefix: string, token: string) => {
        if (!bucket || !token) return;

        setFolders(null);
        setObjects(null);

        try {
            const [foldersData, objectsData] = await Promise.all([
                listFolders(bucket, prefix, token),
                listObjects(bucket, prefix, token)
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