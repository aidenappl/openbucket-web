import { useState, useEffect } from 'react';

export const useViewFormat = () => {
    const [format, setFormat] = useState<"grid" | "list" | null>(null);

    useEffect(() => {
        // Only access localStorage on client side
        if (typeof window !== 'undefined') {
            // Load saved format from localStorage
            const saved = localStorage.getItem("viewFormat") as "grid" | "list";
            setFormat(saved || "list");
        }
    }, []);

    useEffect(() => {
        // Save format to localStorage when it changes (only on client side)
        if (typeof window !== 'undefined' && format) {
            localStorage.setItem("viewFormat", format);
        }
    }, [format]);

    return {
        format,
        setFormat
    };
};