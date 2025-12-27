# Support Ticket Feature

Support Tickets system for user assistance and issue resolution.

## Structure

```
support/
├── components/          # User-facing components
│   ├── TicketList.tsx        # List of user's tickets
│   ├── TicketCard.tsx        # Individual ticket card
│   ├── TicketDetail.tsx      # Full ticket view with messages
│   ├── CreateTicketForm.tsx  # Create new ticket form
│   ├── TicketChat.tsx        # Message thread display
│   └── TicketFileUpload.tsx  # File attachment uploader
│
├── admin/               # Admin components for ticket management
│   ├── TicketDashboard.tsx   # Overview dashboard with stats
│   ├── TicketQueue.tsx       # All tickets queue view
│   ├── TicketAssignment.tsx  # Assign tickets to agents
│   ├── TemplateManager.tsx   # Response templates management
│   └── TicketStats.tsx       # Statistics and metrics
│
└── index.ts             # Barrel export
```

## Components Overview

### User Components

#### TicketList
- Displays user's tickets
- Filtering by status, category, priority
- Search functionality
- Sorting options
- Pagination

#### TicketCard
- Ticket preview card
- Shows: ticket number, subject, status, priority, last update
- Unread message indicator
- Quick actions

#### TicketDetail
- Full ticket view
- Ticket info (number, status, category, priority)
- Message thread
- Add new message
- File attachments
- Close ticket action
- Status history

#### CreateTicketForm
- Create new ticket form
- Fields:
  - Category selection
  - Subject
  - Description
  - Priority
  - File attachments
- Validation
- Category descriptions/help text

#### TicketChat
- Message thread display
- User messages vs agent messages
- Internal notes (admin only, highlighted)
- Timestamps
- File attachments per message
- Auto-scroll to latest

#### TicketFileUpload
- Drag-and-drop file upload
- File validation (size, type)
- Upload progress
- File preview
- Remove files

### Admin Components

#### TicketDashboard
- Key metrics cards:
  - Total tickets
  - By status (new, in progress, waiting user, resolved, closed)
  - By priority
  - By category
  - Average response time
  - Average resolution time
- Recent tickets list
- Charts/graphs

#### TicketQueue
- All tickets view with filters
- Advanced filtering:
  - Status (multiple selection)
  - Category (multiple selection)
  - Priority
  - Assigned to (agent)
  - Date range
  - Search
- Bulk actions
- Quick status update
- Assignment dropdown

#### TicketAssignment
- Assign tickets to agents
- Agent workload view
- Drag-and-drop assignment
- Add internal note on assignment

#### TemplateManager
- List all response templates
- Create/edit/delete templates
- Template categories
- Template usage stats
- Insert template into message

#### TicketStats
- Detailed statistics
- SLA metrics
- Agent performance
- Category trends
- Response time charts
- Resolution time charts
- Export reports

## Dependencies

- Entity layer: `/entities/support`
- Shared UI: `/shared/ui`
- Constants: `/shared/constants/ticket.constants.ts`
- Routes: `/shared/constants/routes.ts`

## State Management

Uses React Query hooks from `/entities/support/ticket.hooks.ts`:

**User hooks:**
- `useMyTickets()` - Fetch user's tickets
- `useTicket(id)` - Fetch single ticket
- `useCreateTicket()` - Create ticket
- `useAddMessage()` - Add message
- `useCloseTicket()` - Close ticket

**Admin hooks:**
- `useAllTickets()` - Fetch all tickets
- `useUpdateTicket()` - Update ticket
- `useUpdateTicketStatus()` - Change status
- `useAssignTicket()` - Assign to agent
- `useDeleteTicket()` - Delete ticket
- `useTemplates()` - Fetch templates
- `useTicketStats()` - Fetch statistics

## File Upload

Uses Supabase Storage bucket: `support-attachments`

**Constraints:**
- Max file size: 10MB
- Allowed types: Images, PDF, Word, Excel, Text
- Max files per ticket: 5
- Max files per message: 3

**Service methods:**
- `TicketService.uploadFile()` - Upload to storage
- `TicketService.getFileUrl()` - Get signed URL
- `TicketService.deleteFile()` - Delete from storage
- `TicketService.validateFile()` - Validate before upload

## Routes

**User routes:**
- `/support/tickets` - Ticket list
- `/support/tickets/new` - Create ticket
- `/support/tickets/:id` - Ticket detail

**Admin routes:**
- `/admin/support` - Dashboard
- `/admin/support/tickets` - All tickets queue
- `/admin/support/tickets/:id` - Ticket detail (admin view)
- `/admin/support/templates` - Template manager
- `/admin/support/statistics` - Stats and reports

## SLA Configuration

Response time thresholds:
- Low priority: 48 hours
- Normal priority: 24 hours
- High priority: 4 hours

Resolution time thresholds:
- Low priority: 7 days
- Normal priority: 3 days
- High priority: 1 day

## Notifications

**User notifications:**
- New message from agent
- Status change
- Ticket resolved
- Ticket closed

**Admin notifications:**
- New ticket created
- New message from user
- SLA at risk
- SLA breached
