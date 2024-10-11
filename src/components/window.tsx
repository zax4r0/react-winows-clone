import React, { useState, useCallback, useRef, ReactNode } from 'react'
import { X, Minus, Square, Maximize2 } from 'lucide-react'

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

// Custom hook for drag functionality
const useDrag = (initialPosition: Position = { x: 0, y: 0 }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const offset = useRef<Position>({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  return { position, setPosition, handleMouseDown, handleMouseMove, handleMouseUp }
}

// Custom hook for resize functionality
const useResize = (initialSize: Size = { width: 300, height: 200 }) => {
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const startPos = useRef<Position>({ x: 0, y: 0 })
  const startSize = useRef<Size>({ width: 0, height: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { width: size.width, height: size.height }
  }, [size])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const deltaX = e.clientX - startPos.current.x
      const deltaY = e.clientY - startPos.current.y
      setSize({
        width: Math.max(200, startSize.current.width + deltaX),
        height: Math.max(150, startSize.current.height + deltaY),
      })
    }
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  return { size, setSize, handleResizeStart, handleResizeMove, handleResizeEnd }
}

interface WindowProps {
  id: number;
  title: string;
  onClose: (id: number) => void;
  onFocus: (id: number) => void;
  zIndex: number;
  children: ReactNode;
}

// Window component
const Window: React.FC<WindowProps> = ({ id, title, onClose, onFocus, zIndex, children }) => {
  const { position, setPosition, handleMouseDown, handleMouseMove, handleMouseUp } = useDrag()
  const { size, setSize, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const prevSize = useRef<Size>({ width: 0, height: 0 })
  const prevPosition = useRef<Position>({ x: 0, y: 0 })

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleResizeMove, handleResizeEnd])

  const toggleMaximize = () => {
    if (isMaximized) {
      setSize(prevSize.current)
      setPosition(prevPosition.current)
    } else {
      prevSize.current = size
      prevPosition.current = position
      setSize({ width: window.innerWidth, height: window.innerHeight })
      setPosition({ x: 0, y: 0 })
    }
    setIsMaximized(!isMaximized)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div
      className={`absolute bg-white shadow-lg rounded-lg overflow-hidden ${isMinimized ? 'h-10' : ''}`}
      style={{
        width: size.width,
        height: isMinimized ? 40 : size.height,
        left: position.x,
        top: position.y,
        zIndex,
      }}
      onMouseDown={() => onFocus(id)}
    >
      <div
        className="bg-gray-200 p-2 cursor-move flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <span className="font-semibold">{title}</span>
        <div className="flex space-x-2">
          <button className="p-1 hover:bg-gray-300 rounded" onClick={toggleMinimize}><Minus size={16} /></button>
          <button className="p-1 hover:bg-gray-300 rounded" onClick={toggleMaximize}>
            {isMaximized ? <Square size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="p-1 hover:bg-gray-300 rounded" onClick={() => onClose(id)}><X size={16} /></button>
        </div>
      </div>
      {!isMinimized && (
        <>
          <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
            {children}
          </div>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  )
}

// Sample window contents
const TextContent: React.FC = () => <p>This is a simple text content window.</p>
const CounterContent: React.FC = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
const ImageContent: React.FC = () => (
  <img src="/placeholder.svg?height=150&width=300" alt="Placeholder" className="w-full h-auto" />
)

interface WindowData {
  id: number;
  title: string;
  zIndex: number;
  contentType: string;
}

// Main WindowManager component
const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<WindowData[]>([])
  const [maxZIndex, setMaxZIndex] = useState(0)

  const createWindow = useCallback((contentType: string) => {
    const newWindow: WindowData = {
      id: Date.now(),
      title: `Window ${windows.length + 1}`,
      zIndex: maxZIndex + 1,
      contentType,
    }
    setWindows([...windows, newWindow])
    setMaxZIndex(maxZIndex + 1)
  }, [windows, maxZIndex])

  const closeWindow = useCallback((id: number) => {
    setWindows(windows.filter(w => w.id !== id))
  }, [windows])

  const focusWindow = useCallback((id: number) => {
    setWindows(windows.map(w => 
      w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
    ))
    setMaxZIndex(maxZIndex + 1)
  }, [windows, maxZIndex])

  const renderWindowContent = (contentType: string) => {
    switch (contentType) {
      case 'text':
        return <TextContent />
      case 'counter':
        return <CounterContent />
      case 'image':
        return <ImageContent />
      default:
        return <p>Unknown content type</p>
    }
  }

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden p-4">
      <div className="space-x-2 mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => createWindow('text')}
        >
          New Text Window
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() => createWindow('counter')}
        >
          New Counter Window
        </button>
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          onClick={() => createWindow('image')}
        >
          New Image Window
        </button>
      </div>
      {windows.map(window => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          onClose={closeWindow}
          onFocus={focusWindow}
          zIndex={window.zIndex}
        >
          {renderWindowContent(window.contentType)}
        </Window>
      ))}
    </div>
  )
}

export default WindowManager