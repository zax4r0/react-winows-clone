'use client';

import React, { useState, useCallback, useRef, ReactNode, useMemo, useEffect } from 'react';
import { X, Minus, Square, Maximize2, Layout, Laptop } from 'lucide-react';
import { DesktopIcons } from './desktop-icons';
import { Bus, EventPayloadMap } from '~/lib/event-bus';
import { TextContent, CounterContent, ImageContent } from './window-content';
import { ContextMenuComponent } from './context-menu';
import { cn } from '~/lib/utils';
import Taskbar from './task-bar';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface WindowProps {
    id: number;
    title: string;
    onClose: (id: number) => void;
    onFocus: (id: number) => void;
    onMinimize: (id: number) => void;
    zIndex: number;
    isMinimized: boolean;
    isActive: boolean;
    children: ReactNode;
    onPositionChange: (id: number, position: Position, size: Size) => void;
}

export interface WindowData {
    id: number;
    title: string;
    zIndex: number;
    contentType: string;
    isMinimized: boolean;
    position: Position;
    size: Size;
}

export interface WindowSXtate extends WindowData {
    isActive: boolean;
}

export interface SnapZone {
    position: Position;
    size: Size;
}

const TASKBAR_HEIGHT = 40;
const MIN_WINDOW_WIDTH = 200;
const MIN_WINDOW_HEIGHT = 150;

export const WINDOW_X = 'window';

export const WINDOW_X_EVENTS = {
    CREATE_WINDOW: 'createWindow',
};

interface WindowEventPayloadMap extends EventPayloadMap {
    createWindow: WindowData;
}

const bus = new Bus<WindowEventPayloadMap>();

export { bus };

const useDragResizeSnap = (
    initialPosition: Position,
    initialSize: Size,
    id: number,
    onPositionChange: (id: number, position: Position, size: Size) => void,
    setActiveSnapZones: React.Dispatch<React.SetStateAction<SnapZone[]>>,
) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const offset = useRef<Position>({ x: 0, y: 0 });
    const isMetaPressed = useRef(false);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, direction: string | null = null) => {
            e.stopPropagation();
            if (direction) {
                setIsResizing(true);
                setResizeDirection(direction);
            } else if (isMetaPressed.current || e.target === e.currentTarget) {
                setIsDragging(true);
            }
            offset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        },
        [position],
    );

    const calculateSnapZones = (newPosition: Position, newSize: Size): SnapZone[] => {
        const snapThreshold = 20;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - TASKBAR_HEIGHT;
        const activeZones: SnapZone[] = [];

        // Left edge
        if (newPosition.x <= snapThreshold) {
            activeZones.push({
                position: { x: 0, y: 0 },
                size: { width: screenWidth / 2, height: screenHeight },
            });
        }
        // Right edge
        if (newPosition.x + newSize.width >= screenWidth - snapThreshold) {
            activeZones.push({
                position: { x: screenWidth / 2, y: 0 },
                size: { width: screenWidth / 2, height: screenHeight },
            });
        }
        // Top edge
        if (newPosition.y <= snapThreshold) {
            activeZones.push({
                position: { x: 0, y: 0 },
                size: { width: screenWidth, height: screenHeight / 2 },
            });
        }
        // Bottom edge
        if (newPosition.y + newSize.height >= screenHeight - snapThreshold) {
            activeZones.push({
                position: { x: 0, y: screenHeight / 2 },
                size: { width: screenWidth, height: screenHeight / 2 },
            });
        }

        // Corner snapping
        if (newPosition.x <= snapThreshold && newPosition.y <= snapThreshold) {
            // Top-left corner
            activeZones.push({
                position: { x: 0, y: 0 },
                size: { width: screenWidth / 2, height: screenHeight / 2 },
            });
        }
        if (newPosition.x + newSize.width >= screenWidth - snapThreshold && newPosition.y <= snapThreshold) {
            // Top-right corner
            activeZones.push({
                position: { x: screenWidth / 2, y: 0 },
                size: { width: screenWidth / 2, height: screenHeight / 2 },
            });
        }
        if (newPosition.x <= snapThreshold && newPosition.y + newSize.height >= screenHeight - snapThreshold) {
            // Bottom-left corner
            activeZones.push({
                position: { x: 0, y: screenHeight / 2 },
                size: { width: screenWidth / 2, height: screenHeight / 2 },
            });
        }
        if (
            newPosition.x + newSize.width >= screenWidth - snapThreshold &&
            newPosition.y + newSize.height >= screenHeight - snapThreshold
        ) {
            // Bottom-right corner
            activeZones.push({
                position: { x: screenWidth / 2, y: screenHeight / 2 },
                size: { width: screenWidth / 2, height: screenHeight / 2 },
            });
        }

        return activeZones;
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const newPosition = {
                    x: e.clientX - offset.current.x,
                    y: e.clientY - offset.current.y,
                };
                const activeZones = calculateSnapZones(newPosition, size);
                setActiveSnapZones(activeZones);
                setPosition(newPosition);
                onPositionChange(id, newPosition, size);
            } else if (isResizing) {
                let newPosition = { ...position };
                let newSize = { ...size };

                switch (resizeDirection) {
                    case 'n':
                        newPosition.y = e.clientY;
                        newSize.height = size.height + (position.y - e.clientY);
                        break;
                    case 's':
                        newSize.height = e.clientY - position.y;
                        break;
                    case 'w':
                        newPosition.x = e.clientX;
                        newSize.width = size.width + (position.x - e.clientX);
                        break;
                    case 'e':
                        newSize.width = e.clientX - position.x;
                        break;
                    case 'nw':
                        newPosition.x = e.clientX;
                        newPosition.y = e.clientY;
                        newSize.width = size.width + (position.x - e.clientX);
                        newSize.height = size.height + (position.y - e.clientY);
                        break;
                    case 'ne':
                        newPosition.y = e.clientY;
                        newSize.width = e.clientX - position.x;
                        newSize.height = size.height + (position.y - e.clientY);
                        break;
                    case 'sw':
                        newPosition.x = e.clientX;
                        newSize.width = size.width + (position.x - e.clientX);
                        newSize.height = e.clientY - position.y;
                        break;
                    case 'se':
                        newSize.width = e.clientX - position.x;
                        newSize.height = e.clientY - position.y;
                        break;
                }

                newSize.width = Math.max(newSize.width, MIN_WINDOW_WIDTH);
                newSize.height = Math.max(newSize.height, MIN_WINDOW_HEIGHT);

                const activeZones = calculateSnapZones(newPosition, newSize);
                setActiveSnapZones(activeZones);
                setPosition(newPosition);
                setSize(newSize);
                onPositionChange(id, newPosition, newSize);
            }
        },
        [isDragging, isResizing, resizeDirection, position, size, id, onPositionChange, setActiveSnapZones],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
        setActiveSnapZones([]);

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - TASKBAR_HEIGHT;
        const snapThreshold = 20;
        let newPosition = { ...position };
        let newSize = { ...size };

        // Snap to the closest zone
        if (position.x <= snapThreshold) {
            newPosition.x = 0;
            newSize.width = screenWidth / 2;
        } else if (position.x + size.width >= screenWidth - snapThreshold) {
            newPosition.x = screenWidth / 2;
            newSize.width = screenWidth / 2;
        }

        if (position.y <= snapThreshold) {
            newPosition.y = 0;
            newSize.height = screenHeight / 2;
        } else if (position.y + size.height >= screenHeight - snapThreshold) {
            newPosition.y = screenHeight / 2;
            newSize.height = screenHeight / 2;
        }

        // Corner snapping
        if (position.x <= snapThreshold && position.y <= snapThreshold) {
            newPosition = { x: 0, y: 0 };
            newSize = { width: screenWidth / 2, height: screenHeight / 2 };
        } else if (position.x + size.width >= screenWidth - snapThreshold && position.y <= snapThreshold) {
            newPosition = { x: screenWidth / 2, y: 0 };
            newSize = { width: screenWidth / 2, height: screenHeight / 2 };
        } else if (position.x <= snapThreshold && position.y + size.height >= screenHeight - snapThreshold) {
            newPosition = { x: 0, y: screenHeight / 2 };
            newSize = { width: screenWidth / 2, height: screenHeight / 2 };
        } else if (
            position.x + size.width >= screenWidth - snapThreshold &&
            position.y + size.height >= screenHeight - snapThreshold
        ) {
            newPosition = { x: screenWidth / 2, y: screenHeight / 2 };
            newSize = { width: screenWidth / 2, height: screenHeight / 2 };
        }

        setPosition(newPosition);
        setSize(newSize);
        onPositionChange(id, newPosition, newSize);
    }, [position, size, id, onPositionChange, setActiveSnapZones]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Meta') {
                isMetaPressed.current = true;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Meta') {
                isMetaPressed.current = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return {
        position,
        size,
        setPosition,
        setSize,
        handleMouseDown,
    };
};

const Window: React.FC<WindowProps> = React.memo(
    ({ id, title, onClose, onFocus, onMinimize, zIndex, isMinimized, isActive, children, onPositionChange }) => {
        const [activeSnapZones, setActiveSnapZones] = useState<SnapZone[]>([]);
        const { position, size, setPosition, setSize, handleMouseDown } = useDragResizeSnap(
            { x: 100, y: 100 },
            { width: 900, height: 400 },
            id,
            onPositionChange,
            setActiveSnapZones,
        );

        const [isMaximized, setIsMaximized] = useState(false);
        const prevSize = useRef<Size>({ width: 700, height: 600 });
        const prevPosition = useRef<Position>({ x: 100, y: 100 });

        const toggleMaximize = useCallback(() => {
            if (isMaximized) {
                setSize(prevSize.current);
                setPosition(prevPosition.current);
            } else {
                prevSize.current = size;
                prevPosition.current = position;
                setSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
                setPosition({ x: 0, y: 0 });
            }
            setIsMaximized(!isMaximized);
            onPositionChange(id, position, size);
        }, [isMaximized, size, position, setSize, setPosition, id, onPositionChange]);

        const handleMinimize = useCallback(() => {
            onMinimize(id);
        }, [onMinimize, id]);

        const handleClose = useCallback(() => onClose(id), [onClose, id]);
        const handleFocus = useCallback(() => onFocus(id), [onFocus, id]);

        const windowSXtyle = useMemo(
            () => ({
                width: size.width,
                height: size.height,
                left: position.x,
                top: position.y,
                zIndex,
                display: isMinimized ? 'none' : 'block',
                boxShadow: isActive ? '0 0 0 2px #3b82f6' : 'none',
            }),
            [size, position, zIndex, isMinimized, isActive],
        );

        return (
            <div
                className={cn('absolute select-none overflow-hidden bg-white shadow-lg dark:bg-[#17171A]', {
                    'ring-2 ring-blue-500': isActive,
                    'rounded-none': isMaximized,
                    'rounded-lg': !isMaximized,
                })}
                style={windowSXtyle}
                onMouseDown={(e) => {
                    handleMouseDown(e);
                    handleFocus();
                }}
            >
                <div
                    className="flex cursor-move items-center justify-between bg-gray-200 p-2 dark:bg-[#08080A]"
                    onMouseDown={(e) => handleMouseDown(e)}
                    onDoubleClick={toggleMaximize}
                >
                    <span className="font-semibold">{title}</span>
                    <div className="flex space-x-2">
                        <button
                            className="rounded p-1 hover:bg-gray-300 dark:hover:bg-gray-800"
                            onClick={handleMinimize}
                        >
                            <Minus size={16} />
                        </button>
                        <button
                            className="rounded p-1 hover:bg-gray-300 dark:hover:bg-gray-800"
                            onClick={toggleMaximize}
                        >
                            {isMaximized ? <Square size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button className="rounded p-1 hover:bg-red-500" onClick={handleClose}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
                    {children}
                </div>
                {/* Resize handles */}
                <div
                    className="absolute left-0 top-0 h-2 w-2 cursor-nw-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                />
                <div
                    className="absolute right-0 top-0 h-2 w-2 cursor-ne-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                />
                <div
                    className="absolute bottom-0 left-0 h-2 w-2 cursor-sw-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                />
                <div
                    className="absolute bottom-0 right-0 h-2 w-2 cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                />
                <div
                    className="absolute left-2 right-2 top-0 h-1 cursor-n-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'n')}
                />
                <div
                    className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
                    onMouseDown={(e) => handleMouseDown(e, 's')}
                />
                <div
                    className="absolute bottom-2 left-0 top-2 w-1 cursor-w-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'w')}
                />
                <div
                    className="absolute bottom-2 right-0 top-2 w-1 cursor-e-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'e')}
                />
            </div>
        );
    },
);

// const Taskbar: React.FC<{
//     windowsX: WindowSXtate[];
//     onFocus: (id: number) => void;
// }> = React.memo(({ windowsX, onFocus }) => {
//     return (
//         <div className="fixed bottom-4 left-1/2 flex h-12 min-w-[98%] -translate-x-1/2 transform items-center space-x-2 rounded-sm bg-gray-800 bg-opacity-60 px-4 shadow-lg backdrop-blur-md">
//             {windowsX.map((window) => (
//                 <button
//                     key={window.id}
//                     className={`flex h-10 items-center space-x-1 rounded-sm px-3 ${
//                         window.isActive ? 'bg-blue-600' : window.isMinimized ? 'bg-gray-600' : 'bg-gray-700'
//                     } transition-colors duration-200 hover:bg-gray-500`}
//                     onClick={() => onFocus(window.id)}
//                 >
//                     <Layout size={16} className="text-white" />
//                     <span className="max-w-[100px] truncate text-sm text-white">{window.title}</span>
//                 </button>
//             ))}
//         </div>
//     );
// });

export const SnapZones: React.FC<{ zones: SnapZone[] }> = ({ zones }) => {
    return (
        <>
            {zones.map((zone, index) => (
                <div
                    key={index}
                    className="pointer-events-none absolute rounded-lg border-2 border-red-500 border-opacity-50 bg-blue-500 bg-opacity-50"
                    style={{
                        left: zone.position.x,
                        top: zone.position.y,
                        width: zone.size.width,
                        height: zone.size.height,
                    }}
                />
            ))}
        </>
    );
};

const WindowManager: React.FC = () => {
    const [windowsX, setWindowsX] = useState<WindowSXtate[]>([]);
    const [activeSnapZones, setActiveSnapZones] = useState<SnapZone[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
    const listenerRegistered = useRef(false); // Use a ref to track listener registration

    const createWindow = useCallback((contentType: string) => {
        console.log(contentType);
        setWindowsX((prevWindowsX) => {
            const newMaxZIndex = prevWindowsX.length > 0 ? Math.max(...prevWindowsX.map((w) => w.zIndex)) + 1 : 1;
            const newWindow: WindowSXtate = {
                id: Date.now(),
                title: `Window ${prevWindowsX.length + 1}`,
                zIndex: newMaxZIndex,
                contentType,
                isMinimized: false,
                position: { x: 100, y: 100 },
                size: { width: 400, height: 300 },
                isActive: true,
            };
            return [...prevWindowsX.map((w) => ({ ...w, isActive: false })), newWindow];
        });
    }, []);

    const closeWindow = useCallback((id: number) => {
        setWindowsX((prevWindowsX) => prevWindowsX.filter((w) => w.id !== id));
    }, []);

    const focusWindow = useCallback((id: number) => {
        setWindowsX((prevWindowsX) => {
            const newMaxZIndex = Math.max(...prevWindowsX.map((w) => w.zIndex)) + 1;
            return prevWindowsX.map((w) =>
                w.id === id
                    ? {
                          ...w,
                          zIndex: newMaxZIndex,
                          isMinimized: false,
                          isActive: true,
                      }
                    : { ...w, isActive: false },
            );
        });
        setActiveWindowId(id);
    }, []);

    const minimizeWindow = useCallback((id: number) => {
        setWindowsX((prevWindowsX) =>
            prevWindowsX.map((w) => (w.id === id ? { ...w, isMinimized: true, isActive: false } : w)),
        );
        setActiveWindowId(null);
    }, []);

    const updateWindowPosition = useCallback((id: number, position: Position, size: Size) => {
        setWindowsX((prevWindowsX) => prevWindowsX.map((w) => (w.id === id ? { ...w, position, size } : w)));
    }, []);

    const renderWindowContent = useCallback((contentType: string) => {
        switch (contentType) {
            case 'text':
                return <TextContent />;
            case 'counter':
                return <CounterContent />;
            case 'image':
                return <ImageContent />;
            default:
                return <p>Unknown content type</p>;
        }
    }, []);

    useEffect(() => {
        if (!listenerRegistered.current) {
            const callback = (payload: string) => createWindow(payload);

            bus.on(WINDOW_X, {
                name: WINDOW_X_EVENTS.CREATE_WINDOW,
                callback,
            });

            listenerRegistered.current = true; // Mark the listener as registered
        }
    }, []);

    const memoizedWindowsX = useMemo(
        () =>
            windowsX.map((window) => (
                <Window
                    key={window.id}
                    id={window.id}
                    title={window.title}
                    onClose={closeWindow}
                    onFocus={focusWindow}
                    onMinimize={minimizeWindow}
                    zIndex={window.zIndex}
                    isMinimized={window.isMinimized}
                    isActive={window.isActive}
                    onPositionChange={updateWindowPosition}
                >
                    {renderWindowContent(window.contentType)}
                </Window>
            )),
        [windowsX, closeWindow, focusWindow, minimizeWindow, updateWindowPosition, renderWindowContent],
    );

    return (
        <div
            className="relative h-screen w-full select-none overflow-hidden bg-cover bg-center"
            style={{
                backgroundImage: "url('/Wall 1.jpg')",
            }}
        >
            <ContextMenuComponent />
            <DesktopIcons />

            {memoizedWindowsX}
            <SnapZones zones={activeSnapZones} />
            <Taskbar windowsX={windowsX} onFocus={focusWindow} />
        </div>
    );
};

export default React.memo(WindowManager);
