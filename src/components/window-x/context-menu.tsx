'use client';

import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '~/components/ui/context-menu';
import { useHotkeys } from 'react-hotkeys-hook';

export function ContextMenuComponent() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useHotkeys('Meta + M', () => setTheme(theme === 'dark' ? 'light' : 'dark'));

    useHotkeys('Meta + [', () => router.back());
    useHotkeys('Meta + ]', () => router.forward());
    useHotkeys('Meta + R', () => router.refresh());
    useHotkeys('Meta + D', () => router.refresh());

    useHotkeys('Meta + I', () => {
        alert(
            'To open Developer Tools:\n\n' +
                'Windows/Linux: Press F12 or Ctrl + Shift + I\n' +
                'macOS: Press Cmd + Option + I',
        );
    });

    const actions = [
        {
            label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
            shortcut: '⌘M',
            disabled: false,
            onClick: () => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
            },
        },
        {
            label: 'Back',
            shortcut: '⌘[',
            disabled: false,
            onClick: () => {
                router.back();
            },
        },
        {
            label: 'Forward',
            shortcut: '⌘]',
            disabled: false,
            onClick: () => {
                router.forward();
            },
        },
        {
            label: 'Refresh',
            shortcut: '⌘R',
            disabled: false,
            onClick: () => {
                router.refresh();
            },
        },
        {
            label: 'Developer Tools',
            onClick: () => {
                alert(
                    'To open Developer Tools:\n\n' +
                        'Windows/Linux: Press F12 or Ctrl + Shift + I\n' +
                        'macOS: Press Cmd + Option + I',
                );
            },
        },
        {
            label: 'More Tools',
            subActions: [
                {
                    label: 'Save Page As...',
                    shortcut: '⇧⌘S',
                    onClick: () => {
                        console.log('Save Page As clicked - implement file saving logic');
                    },
                },
                {
                    label: 'Create Shortcut...',
                    onClick: () => {
                        console.log('Create Shortcut clicked - implement shortcut creation logic');
                    },
                },
                {
                    label: 'Name Window...',
                    onClick: () => {
                        const newName = prompt('Enter a name for the window:');
                        if (newName) {
                            console.log(`Window named: ${newName}`);
                        }
                    },
                },
            ],
        },
    ];

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger className="flex h-full w-full items-center justify-center"></ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    {actions.map((action, index) => {
                        if (action.subActions) {
                            return (
                                <ContextMenuSub key={index}>
                                    <ContextMenuSubTrigger inset>{action.label}</ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                        {action.subActions.map((subAction, subIndex) => (
                                            <ContextMenuItem key={subIndex} onClick={subAction.onClick}>
                                                {subAction.label}
                                                {subAction.shortcut && (
                                                    <ContextMenuShortcut>{subAction.shortcut}</ContextMenuShortcut>
                                                )}
                                            </ContextMenuItem>
                                        ))}
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                            );
                        }
                        return (
                            <ContextMenuItem key={index} inset disabled={action.disabled} onClick={action.onClick}>
                                {action.label}
                                {action.shortcut && <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>}
                            </ContextMenuItem>
                        );
                    })}
                </ContextMenuContent>
            </ContextMenu>
        </>
    );
}
