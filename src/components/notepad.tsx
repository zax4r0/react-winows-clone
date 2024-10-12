'use client';

import { useState } from 'react';
import { Textarea } from '~/components/ui/textarea';
import {
    Menubar,
    MenubarItem,
    MenubarMenu,
    MenubarContent,
    MenubarTrigger,
    MenubarSeparator,
    MenubarShortcut,
} from '~/components/ui/menubar';

export function NotepadComponent() {
    const [text, setText] = useState('');

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleClear = () => {
        setText('');
    };

    const handleSave = () => {
        console.log('Text saved:', text);
    };

    const fileMenuItems = [
        { label: 'New Tab', shortcut: '⌘T', action: handleClear },
        { label: 'Save', shortcut: '⌘S', action: handleSave },
        { label: 'Print...', shortcut: '⌘P', action: () => console.log('Print action') },
    ];

    const editMenuItems = [
        { label: 'Undo', shortcut: '⌘Z', action: () => console.log('Undo action') },
        { label: 'Redo', shortcut: '⇧⌘Z', action: () => console.log('Redo action') },
        { label: 'Clear', shortcut: null, action: handleClear },
    ];

    return (
        <div className="flex h-full w-full flex-col">
            <Menubar className="">
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                        {fileMenuItems.map((item, index) => (
                            <MenubarItem key={index} onClick={item.action}>
                                {item.label} {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
                            </MenubarItem>
                        ))}
                        <MenubarSeparator />
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Edit</MenubarTrigger>
                    <MenubarContent>
                        {editMenuItems.map((item, index) => (
                            <MenubarItem key={index} onClick={item.action}>
                                {item.label} {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
                            </MenubarItem>
                        ))}
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
            <Textarea
                placeholder="Start typing here..."
                value={text}
                onChange={handleTextChange}
                className="flex-1 resize-none rounded-none border-none p-2 font-mono text-sm leading-relaxed focus:outline-none focus-visible:ring-0"
            />
        </div>
    );
}
