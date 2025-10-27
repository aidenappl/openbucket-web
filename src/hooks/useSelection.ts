import { useState, useCallback, useRef } from 'react';

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

export const useSelection = () => {
    const [selectedObjects, setSelectedObjects] = useState<Record<string, boolean>>({});
    const lastSelectedRef = useRef<string | null>(null);

    const toggleObject = useCallback((key: string, shiftKey: boolean = false, allItems: string[] = []) => {
        setSelectedObjects(prev => {
            if (shiftKey && lastSelectedRef.current && allItems.length > 0) {
                // Handle shift-click range selection
                const lastIndex = allItems.indexOf(lastSelectedRef.current);
                const currentIndex = allItems.indexOf(key);

                if (lastIndex !== -1 && currentIndex !== -1) {
                    const startIndex = Math.min(lastIndex, currentIndex);
                    const endIndex = Math.max(lastIndex, currentIndex);
                    const rangeItems = allItems.slice(startIndex, endIndex + 1);

                    // Determine the state to apply (based on the last selected item)
                    const targetState = prev[lastSelectedRef.current] || false;

                    const newSelection = { ...prev };
                    rangeItems.forEach(item => {
                        newSelection[item] = targetState;
                    });

                    return newSelection;
                }
            }

            // Normal toggle behavior
            const newState = !prev[key];
            lastSelectedRef.current = key;

            return {
                ...prev,
                [key]: newState,
            };
        });
    }, []);

    const toggleAll = useCallback((items: string[], newState: boolean) => {
        const newSelection = Object.fromEntries(
            items.map(item => [item, newState])
        );
        setSelectedObjects(newSelection);
        lastSelectedRef.current = null; // Clear last selected on select all
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedObjects({});
        lastSelectedRef.current = null; // Clear last selected on clear
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