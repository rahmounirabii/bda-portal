/**
 * Scheduling Entity
 *
 * Exports for exam scheduling system
 */

// Types
export * from './scheduling.types';

// Services
export * from './scheduling.service';

// Hooks
export * from './scheduling.hooks';

// Named exports for convenience
export {
  getAvailableTimeslots,
  isTimeslotAvailable,
  createTimeslot,
  createExamBooking,
  getUserUpcomingBookings,
  getBookingById,
  getBookingByConfirmationCode,
  getUserBookingHistory,
  rescheduleBooking,
  cancelBooking,
  getAllBookings,
  getAllTimeslots,
} from './scheduling.service';

export {
  schedulingKeys,
  useAllTimeslots,
  useAvailableTimeslots,
  useAllBookings,
  useUpcomingBookings,
  useUserBookingHistory,
  useBookingById,
  useBookingByConfirmationCode,
  useCreateTimeslot,
  useUpdateTimeslot,
  useDeleteTimeslot,
  useCreateBooking,
  useRescheduleBooking,
  useCancelBooking,
  useUpdateBookingStatus,
  useSchedulingStats,
} from './scheduling.hooks';
