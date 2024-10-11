import React, {
    useState,
    useCallback,
    useRef,
    ReactNode,
    useMemo,
    useEffect,
} from "react";
import { X, Minus, Square, Maximize2, Layout } from "lucide-react";

interface Position {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

interface WindowProps {
    id: number;
    title: string;
    onClose: (id: number) => void;
    onFocus: (id: number) => void;
    onMinimize: (id: number) => void;
    zIndex: number;
    isMinimized: boolean;
    children: ReactNode;
    onPositionChange: (id: number, position: Position, size: Size) => void;
}

interface WindowData {
    id: number;
    title: string;
    zIndex: number;
    contentType: string;
    isMinimized: boolean;
    position: Position;
    size: Size;
}

// Custom hook for drag and snap functionality
const useDragAndSnap = (
    initialPosition: Position,
    initialSize: Size,
    id: number,
    onPositionChange: (id: number, position: Position, size: Size) => void,
) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef<Position>({ x: 0, y: 0 });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDragging(true);
            offset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        },
        [position],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const newPosition = {
                    x: e.clientX - offset.current.x,
                    y: e.clientY - offset.current.y,
                };

                // Snapping logic
                const snapThreshold = 20;
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;

                // Snap to left
                if (newPosition.x < snapThreshold) {
                    newPosition.x = 0;
                    setSize({ width: screenWidth / 2, height: screenHeight });
                }
                // Snap to right
                else if (
                    newPosition.x + size.width >
                    screenWidth - snapThreshold
                ) {
                    newPosition.x = screenWidth / 2;
                    setSize({ width: screenWidth / 2, height: screenHeight });
                }
                // Snap to top
                else if (newPosition.y < snapThreshold) {
                    newPosition.y = 0;
                    setSize({ width: screenWidth, height: screenHeight / 2 });
                }
                // Snap to bottom
                else if (
                    newPosition.y + size.height >
                    screenHeight - snapThreshold
                ) {
                    newPosition.y = screenHeight / 2;
                    setSize({ width: screenWidth, height: screenHeight / 2 });
                }

                setPosition(newPosition);
                onPositionChange(id, newPosition, size);
            }
        },
        [isDragging, size, id, onPositionChange],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
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

// Window component (updated)
const Window: React.FC<WindowProps> = React.memo(
    ({
        id,
        title,
        onClose,
        onFocus,
        onMinimize,
        zIndex,
        isMinimized,
        children,
        onPositionChange,
    }) => {
        const { position, size, setPosition, setSize, handleMouseDown } =
            useDragAndSnap(
                { x: 100, y: 100 },
                { width: 400, height: 300 },
                id,
                onPositionChange,
            );

        const [isMaximized, setIsMaximized] = useState(false);
        const prevSize = useRef<Size>({ width: 400, height: 300 });
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
                    height: window.innerHeight - 40,
                });
                setPosition({ x: 0, y: 0 });
            }
            setIsMaximized(!isMaximized);
            onPositionChange(id, position, size);
        }, [
            isMaximized,
            size,
            position,
            setSize,
            setPosition,
            id,
            onPositionChange,
        ]);

        const handleMinimize = useCallback(() => {
            onMinimize(id);
        }, [onMinimize, id]);

        const handleClose = useCallback(() => onClose(id), [onClose, id]);
        const handleFocus = useCallback(() => onFocus(id), [onFocus, id]);

        const windowStyle = useMemo(
            () => ({
                width: size.width,
                height: size.height,
                left: position.x,
                top: position.y,
                zIndex,
                display: isMinimized ? "none" : "block",
            }),
            [size, position, zIndex, isMinimized],
        );

        return (
            <div
                className="absolute overflow-hidden rounded-lg bg-white shadow-lg"
                style={windowStyle}
                onMouseDown={handleFocus}
            >
                <div
                    className="flex cursor-move items-center justify-between bg-gray-200 p-2"
                    onMouseDown={handleMouseDown}
                >
                    <span className="font-semibold">{title}</span>
                    <div className="flex space-x-2">
                        <button
                            className="rounded p-1 hover:bg-gray-300"
                            onClick={handleMinimize}
                        >
                            <Minus size={16} />
                        </button>
                        <button
                            className="rounded p-1 hover:bg-gray-300"
                            onClick={toggleMaximize}
                        >
                            {isMaximized ? (
                                <Square size={16} />
                            ) : (
                                <Maximize2 size={16} />
                            )}
                        </button>
                        <button
                            className="rounded p-1 hover:bg-gray-300"
                            onClick={handleClose}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div
                    className="overflow-auto p-4"
                    style={{ height: "calc(100% - 40px)" }}
                >
                    {children}
                </div>
            </div>
        );
    },
);

// Taskbar component (unchanged)
const Taskbar: React.FC<{
    windows: WindowData[];
    onFocus: (id: number) => void;
}> = React.memo(({ windows, onFocus }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 flex h-10 items-center space-x-2 bg-gray-800 px-2">
            {windows.map((window) => (
                <button
                    key={window.id}
                    className={`flex h-8 items-center space-x-1 rounded px-2 ${
                        window.isMinimized ? "bg-gray-600" : "bg-gray-700"
                    } hover:bg-gray-500`}
                    onClick={() => onFocus(window.id)}
                >
                    <Layout size={16} />
                    <span className="max-w-[100px] truncate text-sm text-white">
                        {window.title}
                    </span>
                </button>
            ))}
        </div>
    );
});

// Sample window contents (unchanged)
const TextContent: React.FC = () => (
    <p>This is a simple text content window.</p>
);

const CounterContent: React.FC = () => {
    const [count, setCount] = useState(0);
    return (
        <div>
            <p>Count: {count}</p>
            <button
                className="rounded bg-blue-500 px-2 py-1 text-white"
                onClick={() => setCount(count + 1)}
            >
                Increment
            </button>
        </div>
    );
};

const ImageContent: React.FC = () => (
    <img
        src="/placeholder.svg?height=150&width=300"
        alt="Placeholder"
        className="h-auto w-full"
    />
);

// Main WindowManager component (updated)
const WindowManager: React.FC = () => {
    const [windows, setWindows] = useState<WindowData[]>([]);

    const createWindow = useCallback((contentType: string) => {
        setWindows((prevWindows) => {
            const newMaxZIndex =
                prevWindows.length > 0
                    ? Math.max(...prevWindows.map((w) => w.zIndex)) + 1
                    : 1;
            return [
                ...prevWindows,
                {
                    id: Date.now(),
                    title: `Window ${prevWindows.length + 1}`,
                    zIndex: newMaxZIndex,
                    contentType,
                    isMinimized: false,
                    position: { x: 100, y: 100 },
                    size: { width: 400, height: 300 },
                },
            ];
        });
    }, []);

    const closeWindow = useCallback((id: number) => {
        setWindows((prevWindows) => prevWindows.filter((w) => w.id !== id));
    }, []);

    const focusWindow = useCallback((id: number) => {
        setWindows((prevWindows) => {
            const newMaxZIndex =
                Math.max(...prevWindows.map((w) => w.zIndex)) + 1;
            return prevWindows.map((w) =>
                w.id === id
                    ? { ...w, zIndex: newMaxZIndex, isMinimized: false }
                    : w,
            );
        });
    }, []);

    const minimizeWindow = useCallback((id: number) => {
        setWindows((prevWindows) =>
            prevWindows.map((w) =>
                w.id === id ? { ...w, isMinimized: true } : w,
            ),
        );
    }, []);

    const updateWindowPosition = useCallback(
        (id: number, position: Position, size: Size) => {
            setWindows((prevWindows) =>
                prevWindows.map((w) =>
                    w.id === id ? { ...w, position, size } : w,
                ),
            );
        },
        [],
    );

    const renderWindowContent = useCallback((contentType: string) => {
        switch (contentType) {
            case "text":
                return <TextContent />;
            case "counter":
                return <CounterContent />;
            case "image":
                return <ImageContent />;
            default:
                return <p>Unknown content type</p>;
        }
    }, []);

    const memoizedWindows = useMemo(
        () =>
            windows.map((window) => (
                <Window
                    key={window.id}
                    id={window.id}
                    title={window.title}
                    onClose={closeWindow}
                    onFocus={focusWindow}
                    onMinimize={minimizeWindow}
                    zIndex={window.zIndex}
                    isMinimized={window.isMinimized}
                    onPositionChange={updateWindowPosition}
                >
                    {renderWindowContent(window.contentType)}
                </Window>
            )),
        [
            windows,
            closeWindow,
            focusWindow,
            minimizeWindow,
            updateWindowPosition,
            renderWindowContent,
        ],
    );

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-100">
            <div className="absolute left-0 right-0 top-0 p-4">
                <div className="mb-4 space-x-2">
                    <button
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        onClick={() => createWindow("text")}
                    >
                        New Text Window
                    </button>
                    <button
                        className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                        onClick={() => createWindow("counter")}
                    >
                        New Counter Window
                    </button>
                    <button
                        className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                        onClick={() => createWindow("image")}
                    >
                        New Image Window
                    </button>
                </div>
            </div>
            {memoizedWindows}
            <Taskbar windows={windows} onFocus={focusWindow} />
        </div>
    );
};

export default React.memo(WindowManager);
