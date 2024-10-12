import { Laptop, FileText, Plus, Image as ImageIcon, Clock } from 'lucide-react';
import { type ReactNode } from 'react';
import { bus, WINDOW_X, WINDOW_X_EVENTS } from './window';

const DesktopIcon: React.FC<{ label: string; onClick: (e: React.MouseEvent) => void; icon: ReactNode }> = ({
    label,
    onClick,
    icon,
}) => {
    return (
        <div className="group flex cursor-pointer flex-col items-center" onClick={onClick}>
            <div className="transform rounded-lg p-3 transition duration-200 ease-in-out group-hover:scale-105 group-hover:bg-white group-hover:bg-opacity-20">
                {icon}
            </div>
            <span className="mt-2 transform rounded bg-black bg-opacity-50 px-2 py-1 text-[10px] text-white transition duration-200 ease-in-out group-hover:scale-105">
                {label}
            </span>
        </div>
    );
};

export const DesktopIcons: React.FC = () => {
    const createWindow = (e: React.MouseEvent, name: string) => {
        e?.preventDefault();
        bus.emit(WINDOW_X, WINDOW_X_EVENTS.CREATE_WINDOW, name);
    };

    return (
        <div className="absolute left-4 top-4 flex flex-col space-y-6">
            <DesktopIcon icon={<Laptop size={30} />} label="My Computer" onClick={(e) => createWindow(e, 'computer')} />
            <DesktopIcon
                icon={<FileText size={30} />}
                label="New Text Window"
                onClick={(e) => createWindow(e, 'text')}
            />
            <DesktopIcon
                icon={<Clock size={30} />}
                label="New Counter Window"
                onClick={(e) => createWindow(e, 'counter')}
            />
            <DesktopIcon
                icon={<ImageIcon size={30} />}
                label="New Image Window"
                onClick={(e) => createWindow(e, 'image')}
            />
            <DesktopIcon icon={<Plus size={30} />} label="New File" onClick={(e) => createWindow(e, 'file')} />
        </div>
    );
};
