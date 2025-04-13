import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { CalendarEditor } from './CalendarEditor';
import { CalendarPreview } from './CalendarPreview';
import { FlierConfig, defaultFlierConfig } from '../lib/types';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { Sun, Moon, ZoomIn, ZoomOut, Maximize, Clipboard, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent } from './ui/sheet';

// Helper function to show toast notification
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white`;
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Animate
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

// Helper function to migrate old hashtag format to new format
const migrateHashtags = (config: FlierConfig): FlierConfig => {
  // Deep clone the config to avoid reference issues
  const newConfig = JSON.parse(JSON.stringify(config));
  
  // Check if hashtags exist but are in the old format (strings instead of objects)
  if (newConfig.rightPanel?.hashtags) {
    const hashtags = newConfig.rightPanel.hashtags;
    
    // Check if any hashtag is a string (old format)
    const needsMigration = hashtags.some((hashtag: unknown) => typeof hashtag === 'string');
    
    if (needsMigration) {
      // Convert from string[] to { text: string, color: string }[]
      newConfig.rightPanel.hashtags = hashtags.map((hashtag: unknown, index: number) => {
        if (typeof hashtag === 'string') {
          return { 
            text: hashtag, 
            color: index % 2 === 0 ? '#FFFFFF' : '#FFC107' // Alternate white and yellow
          };
        }
        return hashtag;
      });
    }
  }
  
  return newConfig;
};

export function CalendarTemplate() {
  // Migrate hashtags format if needed before setting initial state
  const initialConfig = migrateHashtags(defaultFlierConfig);
  const [config, setConfig] = useState<FlierConfig>(initialConfig);
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState<number>(30);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Hidden div for export/copy operations
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  
  // Check screen size for responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
      // Set a narrower default editor width for larger screens
      if (window.innerWidth >= 1280) {
        setEditorWidth(25); // Narrower default for large screens
      } else if (window.innerWidth >= 768) {
        setEditorWidth(30); // Medium width for medium screens
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Wrap updateConfig in useCallback to prevent infinite loops
  const updateConfig = useCallback((newConfig: FlierConfig) => {
    setConfig(migrateHashtags(newConfig));
  }, []);

  const copyToClipboard = async () => {
    // Show the export preview
    setShowExportPreview(true);
    
    // Wait for the DOM to update
    setTimeout(async () => {
      if (!exportRef.current) {
        setShowExportPreview(false);
        return;
      }
      
      try {
        // Generate the image
        const dataUrl = await toPng(exportRef.current, { 
          quality: 0.95,
          pixelRatio: 2
        });
        
        // Convert data URL to Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Copy to clipboard using the Clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        
        // Show success toast
        showToast("Calendar image copied to clipboard");
        
        // Trigger confetti for a nice effect
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast("Failed to copy image to clipboard. Please try again.", "error");
      }
      
      // Hide the export preview
      setShowExportPreview(false);
    }, 100);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    
    // Clamp the editor width between 20% and 50%
    const clampedWidth = Math.min(Math.max(newWidth, 20), 50);
    
    setEditorWidth(clampedWidth);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(0.85);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    // Also update the root element with the dark class
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Initialize dark mode based on system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Add document-level event handlers for smooth dragging
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        
        const containerWidth = containerRef.current.clientWidth;
        const newWidth = (e.clientX / containerWidth) * 100;
        
        // Clamp the editor width between 20% and 50%
        const clampedWidth = Math.min(Math.max(newWidth, 20), 50);
        
        setEditorWidth(clampedWidth);
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Toggle editor panel collapsed state
  const toggleEditorCollapse = () => {
    setIsEditorCollapsed(!isEditorCollapsed);
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hidden div for export/copy without border */}
      <div 
        className="fixed top-0 left-0 pointer-events-none opacity-0"
        style={{ visibility: showExportPreview ? 'visible' : 'hidden' }}
      >
        <CalendarPreview config={config} ref={exportRef} forExport={true} />
      </div>
      
      <header className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2 text-white hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Quix</h1>
            <p className="text-sm text-slate-300">Weekly Calendar Template</p>
          </div>
        </div>
        <div className="flex space-x-3 items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleDarkMode}
            className="border-white hover:bg-white mr-2 bg-transparent dark:text-white dark:hover:bg-slate-800 hover:text-white"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            className="border-white hover:bg-white bg-transparent !px-4 dark:text-white dark:hover:bg-slate-800 hover:text-white"
            onClick={copyToClipboard}
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </header>
      
      {/* Mobile Sheet Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0 overflow-auto animate-slide-in-left">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold">Calendar Editor</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              {isSidebarOpen && (
                <CalendarEditor config={config} onChange={updateConfig} />
              )}
            </div>
            <div className="p-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              Made with ❤️ by Quix
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <main 
        className={`flex-1 flex overflow-hidden ${isDarkMode ? 'dark' : ''}`}
        ref={containerRef}
        onMouseMove={isDragging ? handleDrag : undefined}
      >
        {/* Left panel - Editor (hidden on medium and small screens) */}
        <div 
          className={`border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-auto flex flex-col hidden md:flex transition-all duration-300 ${isEditorCollapsed ? 'md:w-0 opacity-0 overflow-hidden' : ''}`}
          style={{ 
            width: isEditorCollapsed ? '0%' : `${editorWidth}%`,
            opacity: isEditorCollapsed ? 0 : 0.95,
            maxWidth: isEditorCollapsed ? '0' : '400px'
          }}
        >
          <div className="flex-1 overflow-auto p-4">
            <CalendarEditor config={config} onChange={updateConfig} />
          </div>
          <div className="p-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            Made with ❤️ by Quix
          </div>
        </div>
        
        {/* Toggle button for editor panel */}
        <button 
          className="absolute top-1/2 transform -translate-y-1/2 left-0 z-20 hidden md:flex items-center justify-center bg-blue-500 dark:bg-blue-600 text-white p-1 rounded-r-md shadow-md transition-all duration-300 focus:outline-none hover:bg-blue-600 dark:hover:bg-blue-700"
          onClick={toggleEditorCollapse}
          aria-label={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
          style={{ 
            left: isEditorCollapsed ? '0' : `calc(${editorWidth}% - 1px)`,
            maxWidth: isEditorCollapsed ? '24px' : '24px'
          }}
        >
          {isEditorCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        
        {/* Resizer handle (hidden on medium and small screens) */}
        <div 
          className={`w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-col-resize flex items-center justify-center z-10 relative active:bg-blue-600 hidden ${isEditorCollapsed ? 'md:hidden' : 'md:flex'}`}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        >
          <div className="absolute w-6 h-12 bg-blue-500 dark:bg-blue-600 rounded-md flex items-center justify-center -right-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <circle cx="8" cy="12" r="1" />
              <circle cx="16" cy="12" r="1" />
            </svg>
          </div>
        </div>
        
        {/* Right panel - Preview (full width on medium and small screens) */}
        <div 
          className="overflow-auto bg-gray-100 dark:bg-gray-900 flex flex-col w-full md:w-auto flex-grow"
          style={{ width: isEditorCollapsed ? '100%' : (isDesktop ? `${100 - editorWidth}%` : '100%') }}
        >
          <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center relative preview-container">
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              {/* Dimensions label */}
              <div className="absolute -top-6 md:-top-8 left-0 right-0 text-center text-sm text-gray-500 dark:text-gray-400">
                {config.dimensions?.width || '8in'} × {config.dimensions?.height || '10in'}
              </div>
              
              {/* Preview container with checkerboard background */}
              <div className="bg-gray-200 dark:bg-gray-600 p-2 sm:p-4 shadow-xl rounded-lg overflow-hidden flex items-center justify-center">
                <div 
                  className="relative origin-center preview-calendar"
                  style={{ 
                    transform: `scale(${zoomLevel})`,
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                >
                  {/* Transparent overlay with help text - only shown initially */}
                  {config === defaultFlierConfig && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 z-10 flex flex-col items-center justify-center text-white p-6 pointer-events-none">
                      <h3 className="text-xl font-bold mb-2">Live Preview</h3>
                      <p className="text-center mb-4">
                        Edit your calendar in the {isDesktop ? "left panel" : "editor"} to see changes here in real-time
                      </p>
                      {isDesktop ? (
                        <div className="text-4xl animate-bounce">👈</div>
                      ) : (
                        <div className="text-4xl animate-bounce">👆</div>
                      )}
                    </div>
                  )}
                  <CalendarPreview config={config} ref={previewRef} />
                </div>
              </div>
            </div>
            
            {/* Zoom controls */}
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8 flex space-x-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg shadow-md zoom-controls">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetZoom}
                className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                aria-label="Reset zoom"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile edit button */}
            <div className="md:hidden absolute top-4 right-4 animate-fade-in">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-full shadow-lg bg-blue-500 hover:bg-blue-600"
              >
                <Menu className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          </div>
          <div className="p-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            Made with ❤️ by Quix
          </div>
        </div>
      </main>
    </div>
  );
} 