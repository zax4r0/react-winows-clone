import React from 'react';
import { Layout } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';
import { type WindowSXtate } from './window';

interface TaskbarProps {
    windowsX: WindowSXtate[];
    onFocus: (id: number) => void;
}

const Taskbar: React.FC<TaskbarProps> = React.memo(({ windowsX, onFocus }) => {
    return (
        <div className="fixed bottom-4 left-1/2 flex h-12 min-w-[98%] -translate-x-1/2 transform items-center space-x-2 rounded-sm bg-gray-800 bg-opacity-60 px-4 shadow-lg backdrop-blur-md">
            {windowsX.map((windowX) => (
                <HoverCard key={windowX.id}>
                    <HoverCardTrigger asChild>
                        <button
                            className={`flex h-10 items-center space-x-1 rounded-sm px-3 ${
                                windowX.isActive ? 'bg-blue-600' : windowX.isMinimized ? 'bg-gray-600' : 'bg-gray-700'
                            } transition-colors duration-200 hover:bg-gray-500`}
                            onClick={() => onFocus(windowX.id)}
                        >
                            <Layout size={16} className="text-white" />
                            <span className="max-w-[100px] truncate text-sm text-white">{windowX.title}</span>
                        </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-0">
                        <div className="space-y-1 p-4">
                            <h4 className="text-sm font-semibold">{windowX.title}</h4>
                            <div className="border border-gray-200 bg-gray-100 p-2">
                                <p className="text-xs text-gray-500">WindowX Content Preview</p>
                                <p className="text-xs text-gray-500">Type: {windowX.contentType}</p>
                                <p className="text-xs text-gray-500">
                                    Size: {windowX.size.width}x{windowX.size.height}
                                </p>
                            </div>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            ))}
        </div>
    );
});

Taskbar.displayName = 'Taskbar';

export default Taskbar;
