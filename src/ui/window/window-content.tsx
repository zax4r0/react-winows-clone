import { useState } from "react";

export const ImageContent: React.FC = () => (
    <img
        src="/api/placeholder/300/150"
        alt="Placeholder"
        className="h-auto w-full"
    />
);

export const TextContent: React.FC = () => (
    <p>This is a simple text content window.</p>
);

export const CounterContent: React.FC = () => {
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
