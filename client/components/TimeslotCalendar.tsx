/**
 * Timeslot Calendar Component
 *
 * Visual calendar with available exam timeslots
 * Requirements: task.md Step 4 - Schedule the Exam
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { type ExamTimeslot } from '@/entities/scheduling';

export interface TimeslotCalendarProps {
  timeslots: ExamTimeslot[];
  selectedTimeslot: ExamTimeslot | null;
  onTimeslotSelect: (timeslot: ExamTimeslot) => void;
  timezone: string;
}

interface GroupedTimeslots {
  [date: string]: ExamTimeslot[];
}

export default function TimeslotCalendar({
  timeslots,
  selectedTimeslot,
  onTimeslotSelect,
  timezone,
}: TimeslotCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group timeslots by date
  const groupedTimeslots = useMemo(() => {
    const grouped: GroupedTimeslots = {};

    timeslots.forEach((timeslot) => {
      const date = new Date(timeslot.start_time);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(timeslot);
    });

    // Sort timeslots within each date
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return grouped;
  }, [timeslots]);

  // Get dates with available timeslots in current month
  const datesInCurrentMonth = useMemo(() => {
    return Object.keys(groupedTimeslots).filter((dateKey) => {
      const date = new Date(dateKey);
      return (
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
      );
    });
  }, [groupedTimeslots, currentMonth]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{ date: number | null; dateKey: string | null; isToday: boolean }> = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, dateKey: null, isToday: false });
    }

    // Add days of the month
    const today = new Date();
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDate = new Date(year, month, date);
      const dateKey = currentDate.toISOString().split('T')[0];
      const isToday =
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();
      days.push({ date, dateKey, isToday });
    }

    return days;
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey);
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day.date || !day.dateKey) {
              return <div key={index} className="aspect-square" />;
            }

            const hasTimeslots = groupedTimeslots[day.dateKey]?.length > 0;
            const isSelected = day.dateKey === selectedDate;

            return (
              <button
                key={index}
                onClick={() => hasTimeslots && handleDateClick(day.dateKey!)}
                disabled={!hasTimeslots}
                className={`
                  aspect-square rounded-lg border-2 transition-all
                  flex flex-col items-center justify-center
                  ${day.isToday ? 'border-blue-400' : 'border-gray-200'}
                  ${hasTimeslots ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50' : 'cursor-not-allowed bg-gray-50'}
                  ${isSelected ? 'border-blue-600 bg-blue-100' : ''}
                `}
              >
                <span className={`text-sm font-medium ${hasTimeslots ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day.date}
                </span>
                {hasTimeslots && (
                  <Badge variant="secondary" className="text-xs mt-1 px-1 py-0">
                    {groupedTimeslots[day.dateKey].length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Timeslots for Selected Date */}
      {selectedDate && groupedTimeslots[selectedDate] && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Available Times on {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {groupedTimeslots[selectedDate].map((timeslot) => {
                const isSelected = selectedTimeslot?.id === timeslot.id;
                const availableSlots = timeslot.available_slots ||
                  (timeslot.max_capacity - timeslot.current_bookings);

                return (
                  <button
                    key={timeslot.id}
                    onClick={() => onTimeslotSelect(timeslot)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-lg">
                            {formatTime(timeslot.start_time)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatTime(timeslot.end_time)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={availableSlots > 3 ? 'default' : availableSlots > 0 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {availableSlots} available
                        </Badge>
                        {isSelected && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Help Text */}
      {!selectedDate && datesInCurrentMonth.length > 0 && (
        <div className="text-center text-sm text-gray-600 py-4">
          Click on a highlighted date to see available times
        </div>
      )}

      {datesInCurrentMonth.length === 0 && (
        <div className="text-center text-sm text-gray-600 py-8">
          No available timeslots in this month. Try another month.
        </div>
      )}
    </div>
  );
}
