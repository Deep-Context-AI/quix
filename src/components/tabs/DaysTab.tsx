import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { FlierConfig, DayBlock, DayEvent } from '../../lib/types';

interface DaysTabProps {
  config: FlierConfig;
  updateConfig: (updates: Partial<FlierConfig>) => void;
  startDate: Date;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DaysTab({ config, updateConfig, startDate, onStartDateChange }: DaysTabProps) {
  const updateDay = (index: number, dayUpdates: Partial<DayBlock>) => {
    const newDays = [...config.days];
    newDays[index] = { ...newDays[index], ...dayUpdates };
    updateConfig({ days: newDays });
  };

  const updateEvent = (dayIndex: number, eventIndex: number, eventUpdates: Partial<DayEvent>) => {
    const newDays = [...config.days];
    newDays[dayIndex].events[eventIndex] = { 
      ...newDays[dayIndex].events[eventIndex], 
      ...eventUpdates 
    };
    updateConfig({ days: newDays });
  };

  const addEvent = (dayIndex: number) => {
    const newDays = [...config.days];
    newDays[dayIndex].events.push({ title: '', time: '', isOptional: false });
    updateConfig({ days: newDays });
  };

  const removeEvent = (dayIndex: number, eventIndex: number) => {
    const newDays = [...config.days];
    newDays[dayIndex].events.splice(eventIndex, 1);
    updateConfig({ days: newDays });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <CardHeader className="pb-4">
          <CardTitle>Week Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="week-start">Week Starting Date</Label>
            <Input 
              id="week-start"
              type="date"
              onChange={(e) => {
                const selected = new Date(e.target.value);
                // Adjust to the Monday of that week if not already Monday
                if (selected.getDay() !== 1) { // 1 is Monday
                  const daysToAdd = selected.getDay() === 0 ? -6 : (1 - selected.getDay());
                  selected.setDate(selected.getDate() + daysToAdd);
                  // Overwrite the value to the corrected Monday
                  e.target.value = selected.toISOString().slice(0, 10);
                }
                onStartDateChange(e);
              }}
              className="w-full"
              value={startDate.toISOString().slice(0, 10)}
              step="7"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Select a date to automatically fill in the days of the week
            </p>
          </div>
        </CardContent>
      </Card>
      
      {config.days.map((day, dayIndex) => (
        <Card key={dayIndex} className="p-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{day.day}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{day.date}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 p-3 rounded-none pb-4">
              <div className="flex items-center space-x-3 ml-auto">
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    id={`day-color-${dayIndex}`}
                    value={day.color || config.headerColor}
                    onChange={(e) => updateDay(dayIndex, { color: e.target.value })}
                    className="w-8 h-8 p-1 rounded cursor-pointer"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateDay(dayIndex, { color: undefined })}
                    className="text-xs"
                    title="Reset to default color"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {day.events.map((event, eventIndex) => (
                <div key={eventIndex} className="p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label 
                        htmlFor={`event-title-${dayIndex}-${eventIndex}`}
                        className="font-medium"
                      >
                        Event Title
                      </Label>
                      <Input 
                        id={`event-title-${dayIndex}-${eventIndex}`}
                        placeholder="Event title"
                        value={event.title}
                        onChange={(e) => 
                          updateEvent(dayIndex, eventIndex, { title: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label 
                        htmlFor={`event-time-${dayIndex}-${eventIndex}`}
                        className="font-medium"
                      >
                        Event Time
                      </Label>
                      <Input 
                        id={`event-time-${dayIndex}-${eventIndex}`}
                        placeholder="8:00PM"
                        value={event.time}
                        onChange={(e) => 
                          updateEvent(dayIndex, eventIndex, { time: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id={`optional-event-${dayIndex}-${eventIndex}`} 
                        checked={event.isOptional}
                        onCheckedChange={(checked) => 
                          updateEvent(dayIndex, eventIndex, { isOptional: !!checked })
                        }
                      />
                      <Label htmlFor={`optional-event-${dayIndex}-${eventIndex}`} className="font-medium">
                        Optional Event
                      </Label>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeEvent(dayIndex, eventIndex)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                onClick={() => addEvent(dayIndex)}
                className="w-full"
                variant="outline"
              >
                Add Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 