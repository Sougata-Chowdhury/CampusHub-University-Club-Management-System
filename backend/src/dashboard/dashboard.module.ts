import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Club, ClubSchema } from '../schemas/club.schema';
import { Event, EventSchema } from '../schemas/event.schema';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: Event.name, schema: EventSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
