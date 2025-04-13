import { forwardRef, useRef, useState } from 'react';
import { FlierConfig } from '../lib/types';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { FireIcon } from '@heroicons/react/24/outline';

// Helper function to adjust HSL lightness for dynamic theme adjustment
function adjustHslLightness(isDarkMode: boolean, baseColor: string = '') {
  // Default to a slate color if no base color is provided
  const fallbackColor = isDarkMode ? 'hsl(215, 16%, 25%)' : 'hsl(215, 16%, 90%)';
  
  try {
    // If baseColor is already in HSL format, adjust it
    if (baseColor.startsWith('hsl')) {
      const match = baseColor.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
      if (match) {
        const [, h, s] = match;
        // In dark mode, we want a subtle but visible light shade
        // In light mode, we want a subtle but visible dark shade
        const newLightness = isDarkMode ? '25%' : '90%';
        return `hsl(${h}, ${s}%, ${newLightness})`;
      }
    }
    
    // If it's a hex color or invalid format, return fallback
    return fallbackColor;
  } catch {
    return fallbackColor;
  }
}

interface CalendarPreviewProps {
  config: FlierConfig;
  forExport?: boolean;
}

export const CalendarPreview = forwardRef<HTMLDivElement, CalendarPreviewProps>(
  ({ config, forExport = false }, ref) => {
    const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    const progressPercentage = Math.min(
      100,
      (config.progress.current / config.progress.goal) * 100
    );
    
    const isGoalReached = progressPercentage >= 100;
    
    // Check if dark mode is active by looking at the document element
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // State to track image loading errors
    const [imgError, setImgError] = useState(false);
    
    // Check if the background image URL is valid
    const hasValidImageUrl = config.rightPanel.backgroundImage && 
                            config.rightPanel.backgroundImage.trim() !== '';
    
    // Dynamic background color for the watermark design
    const watermarkColor = adjustHslLightness(isDarkMode);

    return (
      <div
        ref={ref}
        className={cn(
          "h-full w-full flex overflow-hidden relative",
          isDarkMode ? "bg-gray-900" : "bg-white",
          !forExport && "border-4 border-dashed",
          !forExport && (isDarkMode ? "border-gray-600" : "border-gray-300")
        )}
        style={{ 
          fontFamily: 'Arial, sans-serif',
          width: config.dimensions?.width || '8in',
          height: config.dimensions?.height || '10in',
          maxWidth: '100%',
          maxHeight: forExport ? 'none' : 'calc(100vh - 140px)',
          aspectRatio: forExport ? 'auto' : '0.8/1',
        }}
      >
        {/* Left side - Calendar */}
        <div className="w-3/5 p-8 relative flex flex-col">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <path fill={isDarkMode ? "#4B5563" : "#CED4DA"} d="M42.9,-55.8C55.3,-43.8,65,-29.2,71.7,-11.3C78.4,6.6,82.1,27.8,74,41.3C65.9,54.9,46.1,60.9,27.6,66.5C9.2,72.2,-7.9,77.6,-24.5,74.3C-41.1,71.1,-57.2,59.3,-65.7,43.6C-74.3,27.9,-75.4,8.3,-70.6,-8.2C-65.8,-24.8,-55.1,-38.3,-42.3,-50.3C-29.5,-62.3,-14.7,-72.8,0.6,-73.6C16,-74.3,30.5,-67.8,42.9,-55.8Z" transform="translate(100 100)" />
            </svg>
          </div>
          
          {/* Background design with running icon and goal number */}
          <div className="absolute top-0 left-0 w-full h-60 opacity-100 pointer-events-none overflow-hidden">
            <div className="flex items-center justify-center">
              <FireIcon 
                className="w-25 h-25" 
                style={{ color: watermarkColor }}
              />
              <div 
                className="text-8xl font-black ml-4" 
                style={{ color: watermarkColor }}
              >
                {config.progress.goal}
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col items-center w-full !px-4 !mt-15">
            <h1 className={cn("text-4xl font-black mb-3 text-center", isDarkMode ? "text-white" : "text-slate-800")}>{config.title}</h1>
            <h2 className={cn("text-xl font-medium !mb-10 text-center", isDarkMode ? "text-gray-300" : "text-slate-600")}>{config.subtitle}</h2>
            
            <div className="space-y-6 w-full">
              {config.days.map((day, i) => (
                <div
                  key={i}
                  ref={ref => {
                    if (!dayRefs.current) dayRefs.current = []
                    dayRefs.current[i] = ref
                  }}
                  className={cn(
                    "overflow-hidden relative"
                  )}
                >
                  <div 
                    className="flex items-center !p-2 text-white"
                    style={{ backgroundColor: day.color || config.headerColor }}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="font-bold">{day.day}</div>
                        <div className="text-xs opacity-90">{day.date}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Events */}
                  <div className={cn(
                    "!p-2 w-full",
                    isDarkMode ? "bg-gray-700" : "bg-white"
                  )}>
                    {day.events && day.events.length > 0 ? (
                      day.events.map((event, eventIndex) => (
                        <div 
                          key={eventIndex} 
                          className={cn(
                            "mb-2 last:mb-0 flex items-start w-full",
                            "justify-between"
                          )}
                        >
                          <div className="flex items-center font-medium text-left flex-1 pr-3">
                            <span className={isDarkMode ? "text-white" : "text-gray-800"}>
                              {event.title}
                            </span>
                            {event.isOptional && (
                              <span className="ml-2 bg-blue-600 text-white text-xs !px-2 py-0.5 !ml-2 font-bold whitespace-nowrap rounded-md">
                                OPTIONAL
                              </span>
                            )}
                          </div>
                          {event.time && (
                            <div className={cn(
                              "text-right font-bold whitespace-nowrap",
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              {event.time}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={cn(
                        "text-center italic py-2 w-full",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        No events scheduled
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right side - Hero and hashtags */}
        <div className="w-2/5 relative">
          {/* Background image container with fallback */}
          <div className="absolute inset-0 bg-gray-800 overflow-hidden">
            {hasValidImageUrl && !imgError ? (
              <img 
                src={config.rightPanel.backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
                onError={() => {
                  console.error("Failed to load image:", config.rightPanel.backgroundImage);
                  setImgError(true);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-opacity-50">
                <p className="text-sm">No background image</p>
              </div>
            )}
            {/* Apply appropriate overlay based on image status */}
            {(!hasValidImageUrl || imgError) ? 
              <div className="absolute inset-0 bg-black bg-opacity-40"></div> : 
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div>
            }
          </div>
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
            {/* Hashtags */}
            <div className="flex-1 flex flex-col justify-center">
              {config.rightPanel.hashtags.map((hashtag, index) => (
                <div 
                  key={index} 
                  className="text-5xl font-bold mb-4 drop-shadow-md"
                  style={{ color: hashtag.color }}
                >
                  {hashtag.text}
                </div>
              ))}
              
              {config.rightPanel.hashtags.length === 0 && (
                <div className="text-center text-white text-opacity-70 italic">
                  Add hashtags in the editor
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-auto">
              <div className="mb-2 relative">
                <Progress 
                  value={progressPercentage} 
                  className="h-8 rounded-full overflow-hidden bg-gray-700 bg-opacity-50 !m-5" 
                  style={{ 
                    '--progress-background': config.progress.color 
                  } as React.CSSProperties}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold drop-shadow-md">
                  {`${config.progress.current}/${config.progress.goal}`}
                </div>
                {isGoalReached && (
                  <div className="absolute -top-6 right-0 text-3xl">
                    🎉 🎊
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attribution - absolute positioned at bottom left */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 dark:text-gray-400 opacity-50 z-20">
          Made with Quix
        </div>
      </div>
    );
  }
);

CalendarPreview.displayName = 'CalendarPreview'; 