import { useState, useCallback } from 'react';
import { ObjectHead, S3ObjectMetadata } from '@/types';
import { reqFetchFolders } from '@/services/folder.service';
import { reqFetchBulkObjectHead, reqFetchObjects } from '@/services/object.service';

export const useBucketData = () => {
    const [folders, setFolders] = useState<string[] | null>(null);
    const [objects, setObjects] = useState<S3ObjectMetadata[] | null>(null);
    const [metadata, setMetadata] = useState<ObjectHead[] | null>(null);

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

    const retrieveBulkObjectHead = useCallback(async (keys: string[]) => {
        const response = await reqFetchBulkObjectHead(keys);
        return response.success ? response.data : null;
    }, []);

    const loadBucketData = useCallback(async (bucket: string, prefix: string, token: string) => {
        if (!bucket || !token) return;

        setFolders(null);
        setObjects(null);
        setMetadata(null);

        try {
            const [foldersData, objectsData] = await Promise.all([
                listFolders(prefix),
                listObjects(prefix)
            ]);

            setFolders(foldersData || []);
            setObjects(objectsData || []);

            const keys = (objectsData || []).map(obj => obj.Key);
            if (keys.length > 0) {
                const detailedObjects = await retrieveBulkObjectHead(keys);
                if (detailedObjects) {
                    setMetadata(detailedObjects);
                } else {
                    setMetadata([]);
                }
            } else {
                setMetadata([]);
            }
        } catch (error) {
            console.error('Error loading bucket data:', error);
            setFolders([]);
            setObjects([]);
            setMetadata([]);
        }
    }, [listFolders, listObjects, retrieveBulkObjectHead]);

    return {
        folders,
        metadata,
        objects,
        loadBucketData
    };
};