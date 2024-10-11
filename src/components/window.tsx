import React, { useState, useCallback, useRef, ReactNode, useMemo } from 'react'
import { X, Minus, Square, Maximize2, Layout } from 'lucide-react'

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
}

interface WindowData {
  id: number;
  title: string;
  zIndex: number;
  contentType: string;
  isMinimized: boolean;
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
const useResize = (initialSize: Size = { width: 300, height: 200 }, initialPosition: Position = { x: 0, y: 0 }) => {
  const [size, setSize] = useState(initialSize)
  const [position, setPosition] = useState(initialPosition)
  const [isResizing, setIsResizing] = useState(false)
  const resizeType = useRef<string>('')
  const startPos = useRef<Position>({ x: 0, y: 0 })
  const startSize = useRef<Size>({ width: 0, height: 0 })
  const startPosition = useRef<Position>({ x: 0, y: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent, type: string) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeType.current = type
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { width: size.width, height: size.height }
    startPosition.current = { x: position.x, y: position.y }
  }, [size, position])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const deltaX = e.clientX - startPos.current.x
      const deltaY = e.clientY - startPos.current.y
      let newWidth = startSize.current.width
      let newHeight = startSize.current.height
      let newX = startPosition.current.x
      let newY = startPosition.current.y

      switch (resizeType.current) {
        case 'right':
          newWidth += deltaX
          break
        case 'bottom':
          newHeight += deltaY
          break
        case 'left':
          newWidth -= deltaX
          newX += deltaX
          break
        case 'bottom-right':
          newWidth += deltaX
          newHeight += deltaY
          break
        case 'bottom-left':
          newWidth -= deltaX
          newHeight += deltaY
          newX += deltaX
          break
      }

      setSize({
        width: Math.max(200, newWidth),
        height: Math.max(150, newHeight)
      })
      setPosition({
        x: newX,
        y: newY
      })
    }
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    resizeType.current = ''
  }, [])

  return { size, setSize, position, setPosition, handleResizeStart, handleResizeMove, handleResizeEnd }
}

// Memoized Window component
const Window: React.FC<WindowProps> = React.memo(({ id, title, onClose, onFocus, onMinimize, zIndex, isMinimized, children }) => {
  const { position: dragPosition, handleMouseDown: handleDragMouseDown, handleMouseMove: handleDragMouseMove, handleMouseUp: handleDragMouseUp } = useDrag()
  const { size, setSize, position: resizePosition, setPosition: setResizePosition, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize()
  const [isMaximized, setIsMaximized] = useState(false)
  const prevSize = useRef<Size>({ width: 0, height: 0 })
  const prevPosition = useRef<Position>({ x: 0, y: 0 })

  // Combine drag and resize positions
  const position = useMemo(() => ({
    x: dragPosition.x + resizePosition.x,
    y: dragPosition.y + resizePosition.y
  }), [dragPosition, resizePosition])

  React.useEffect(() => {
    window.addEventListener('mousemove', handleDragMouseMove)
    window.addEventListener('mouseup', handleDragMouseUp)
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
    return () => {
      window.removeEventListener('mousemove', handleDragMouseMove)
      window.removeEventListener('mouseup', handleDragMouseUp)
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleDragMouseMove, handleDragMouseUp, handleResizeMove, handleResizeEnd])

  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      setSize(prevSize.current)
      setResizePosition(prevPosition.current)
    } else {
      prevSize.current = size
      prevPosition.current = position
      setSize({ width: window.innerWidth, height: window.innerHeight - 40 }) // Subtract taskbar height
      setResizePosition({ x: 0, y: 0 })
    }
    setIsMaximized(!isMaximized)
  }, [isMaximized, size, position, setSize, setResizePosition])

  const handleMinimize = useCallback(() => {
    onMinimize(id)
  }, [onMinimize, id])

  const handleClose = useCallback(() => onClose(id), [onClose, id])
  const handleFocus = useCallback(() => onFocus(id), [onFocus, id])

  const windowStyle = useMemo(() => ({
    width: size.width,
    height: size.height,
    left: position.x,
    top: position.y,
    zIndex,
    display: isMinimized ? 'none' : 'block',
  }), [size, position, zIndex, isMinimized])

  return (
    <div
      className="absolute bg-white shadow-lg rounded-lg overflow-hidden"
      style={windowStyle}
      onMouseDown={handleFocus}
    >
      <div
        className="bg-gray-200 p-2 cursor-move flex justify-between items-center"
        onMouseDown={handleDragMouseDown}
      >
        <span className="font-semibold">{title}</span>
        <div className="flex space-x-2">
          <button className="p-1 hover:bg-gray-300 rounded" onClick={handleMinimize}><Minus size={16} /></button>
          <button className="p-1 hover:bg-gray-300 rounded" onClick={toggleMaximize}>
            {isMaximized ? <Square size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="p-1 hover:bg-gray-300 rounded" onClick={handleClose}><X size={16} /></button>
        </div>
      </div>
      <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
        {children}
      </div>
      {/* Resize handles */}
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
      <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
      <div className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
      <div className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize" onMouseDown={(e) => handleResizeStart(e, 'right')} />
      <div className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize" onMouseDown={(e) => handleResizeStart(e, 'left')} />
    </div>
  )
})

// Taskbar component
const Taskbar: React.FC<{ windows: WindowData[], onFocus: (id: number) => void }> = React.memo(({ windows, onFocus }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-gray-800 flex items-center px-2 space-x-2">
      {windows.map(window => (
        <button
          key={window.id}
          className={`h-8 px-2 rounded flex items-center space-x-1 ${window.isMinimized ? 'bg-gray-600' : 'bg-gray-700'} hover:bg-gray-500`}
          onClick={() => onFocus(window.id)}
        >
          <Layout size={16} />
          <span className="text-white text-sm truncate max-w-[100px]">{window.title}</span>
        </button>
      ))}
    </div>
  )
})

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

// Main WindowManager component
const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<WindowData[]>([])

  const createWindow = useCallback((contentType: string) => {
    setWindows(prevWindows => {
      const newMaxZIndex = prevWindows.length > 0
        ? Math.max(...prevWindows.map(w => w.zIndex)) + 1
        : 1
      return [
        ...prevWindows,
        {
          id: Date.now(),
          title: `Window ${prevWindows.length + 1}`,
          zIndex: newMaxZIndex,
          contentType,
          isMinimized: false,
        }
      ]
    })
  }, [])

  const closeWindow = useCallback((id: number) => {
    setWindows(prevWindows => prevWindows.filter(w => w.id !== id))
  }, [])

  const focusWindow = useCallback((id: number) => {
    setWindows(prevWindows => {
      const newMaxZIndex = Math.max(...prevWindows.map(w => w.zIndex)) + 1
      return prevWindows.map(w => 
        w.id === id 
          ? { ...w, zIndex: newMaxZIndex, isMinimized: false }
          : w
      )
    })
  }, [])

  const minimizeWindow = useCallback((id: number) => {
    setWindows(prevWindows => 
      prevWindows.map(w => 
        w.id === id 
          ? { ...w, isMinimized: true }
          : w
      )
    )
  }, [])

  const renderWindowContent = useCallback((contentType: string) => {
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
  }, [])

  const memoizedWindows = useMemo(() => windows.map(window => (
    <Window
      key={window.id}
      id={window.id}
      title={window.title}
      onClose={closeWindow}
      onFocus={focusWindow}
      onMinimize={minimizeWindow}
      zIndex={window.zIndex}
      isMinimized={window.isMinimized}
    >
      {renderWindowContent(window.contentType)}
    </Window>
  )), [windows, closeWindow, focusWindow, minimizeWindow, renderWindowContent])

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 p-4">
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
      </div>
      {memoizedWindows}
      <Taskbar windows={windows} onFocus={focusWindow} />
    </div>
  )
}

export default React.memo(WindowManager)