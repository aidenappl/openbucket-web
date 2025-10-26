import { useState, useCallback } from 'react';

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

export const useSelection = () => {
    const [selectedObjects, setSelectedObjects] = useState<Record<string, boolean>>({});

    const toggleObject = useCallback((key: string) => {
        setSelectedObjects(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    }, []);

    const toggleAll = useCallback((items: string[], newState: boolean) => {
        const newSelection = Object.fromEntries(
            items.map(item => [item, newState])
        );
        setSelectedObjects(newSelection);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedObjects({});
    }, []);

    const getSelectedItems = useCallback((items: string[]) => {
        return items.filter(item => selectedObjects[item]);
    }, [selectedObjects]);

    const getSelectionStats = useCallback((items: string[]) => {
        const selectedCount = items.filter(item => selectedObjects[item]).length;
        const totalCount = items.length;

        const masterCheckboxState: CheckboxState =
            selectedCount === 0
                ? "unchecked"
                : selectedCount === totalCount
                    ? "checked"
                    : "indeterminate";

        return {
            selectedCount,
            totalCount,
            masterCheckboxState
        };
    }, [selectedObjects]);

    return {
        selectedObjects,
        toggleObject,
        toggleAll,
        clearSelection,
        getSelectedItems,
        getSelectionStats
    };
};