import { useState, useCallback } from 'react';

const ROOT_FOLDER = "All Files";

export const useBreadcrumbs = () => {
    const [breadcrumbs, setBreadcrumbs] = useState<string[]>([ROOT_FOLDER]);
    const [prefix, setPrefix] = useState<string>("");

    const navigateToFolder = useCallback((folderPath: string, onNavigate?: (prefix: string) => void) => {
        if (folderPath === ROOT_FOLDER) {
            setBreadcrumbs([ROOT_FOLDER]);
            setPrefix("");
            onNavigate?.("");
            return;
        }

        setBreadcrumbs(prev => [...prev, folderPath]);
        setPrefix(folderPath);
        onNavigate?.(folderPath);
    }, []);

    const navigateToBreadcrumb = useCallback((index: number, onNavigate?: (prefix: string) => void) => {
        const targetPath = breadcrumbs[index];

        if (targetPath === ROOT_FOLDER) {
            setBreadcrumbs([ROOT_FOLDER]);
            setPrefix("");
            onNavigate?.("");
            return;
        }

        setBreadcrumbs(prev => prev.slice(0, index + 1));
        const newPrefix = index === 0 ? "" : targetPath;
        setPrefix(newPrefix);
        onNavigate?.(newPrefix);
    }, [breadcrumbs]);

    const resetToRoot = useCallback((onNavigate?: (prefix: string) => void) => {
        setBreadcrumbs([ROOT_FOLDER]);
        setPrefix("");
        onNavigate?.("");
    }, []);

    const setFromPath = useCallback((path: string, onNavigate?: (prefix: string) => void) => {
        if (!path || path === "") {
            setBreadcrumbs([ROOT_FOLDER]);
            setPrefix("");
            onNavigate?.("");
            return;
        }

        // Build breadcrumbs from path
        const parts = path.split('/').filter(Boolean);
        const newBreadcrumbs = [ROOT_FOLDER];
        let currentPath = "";

        parts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            newBreadcrumbs.push(currentPath);
        });

        setBreadcrumbs(newBreadcrumbs);
        setPrefix(path);
        onNavigate?.(path);
    }, []);

    const getParentPath = useCallback((objectPath: string): string => {
        if (!objectPath) return "";

        const parts = objectPath.split('/');
        if (parts.length <= 1) return "";

        // Remove the last part (filename) to get the parent folder
        parts.pop();
        return parts.join('/');
    }, []);

    return {
        breadcrumbs,
        prefix,
        navigateToFolder,
        navigateToBreadcrumb,
        resetToRoot,
        setFromPath,
        getParentPath,
        ROOT_FOLDER
    };
};