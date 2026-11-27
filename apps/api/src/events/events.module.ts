import { Module } from '@nestjs/common';
import { OrganizerEventsService } from './organizer-events.service';
import { SeatManagementService } from './seat-management.service';
import { PublicEventsService } from './public-events.service';
import { EventReviewService } from './event-review.service';
import { EventStaffService } from './event-staff.service';
import { AttendeesService } from './attendees.service';
import { PublicEventsController } from './public-events.controller';
import { OrganizerEventsController } from './organizer-events.controller';
import { AdminEventsController } from './admin-events.controller';
@Module({
  providers: [
    OrganizerEventsService,
    SeatManagementService,
    PublicEventsService,
    EventReviewService,
    EventStaffService,
    AttendeesService,
  ],
  controllers: [PublicEventsController, OrganizerEventsController, AdminEventsController],
})
export class EventsModule {}
