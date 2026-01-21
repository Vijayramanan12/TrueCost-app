import { useEffect } from 'react';

interface KeyboardShortcuts {
    [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const keys = [];

            if (event.ctrlKey || event.metaKey) keys.push('ctrl');
            if (event.shiftKey) keys.push('shift');
            if (event.altKey) keys.push('alt');

            keys.push(event.key.toLowerCase());

            const keyCombination = keys.join('+');

            if (shortcuts[keyCombination]) {
                event.preventDefault();
                shortcuts[keyCombination]();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
}
