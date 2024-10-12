import { useState } from 'react';
import { NotepadComponent } from '../notepad';

export const ImageContent: React.FC = () => (
    <iframe
        src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=KHRHcF82taBWe2oW"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full"
    ></iframe>
);

export const TextContent: React.FC = () => <NotepadComponent />;

export const CounterContent: React.FC = () => {
    const [count, setCount] = useState(0);
    return (
        <div>
            <p>Count: {count}</p>
            <button className="rounded bg-blue-500 px-2 py-1 text-white" onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
};
