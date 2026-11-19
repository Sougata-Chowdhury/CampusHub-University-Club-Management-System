import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from '../schemas/club.schema';
import { Event, EventDocument } from '../schemas/event.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(Announcement.name) private announcementModel: Model<AnnouncementDocument>,
  ) {}

  /**
   * One aggregate payload for the dashboard instead of 4-6 list requests.
   * Uses counts + projections so list documents are never loaded just for a length.
   */
  async getSummary(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();

    const [createdClubs, joinedClubs, availableClubs, registeredEvents, upcomingRegistrations, pendingPayments, unreadNotifications] =
      await Promise.all([
        this.clubModel.find({ createdBy: userObjectId }).select('name category status members createdAt').lean(),
        this.clubModel.find({ members: userObjectId }).select('name category status members createdAt').lean(),
        this.clubModel.countDocuments({ status: 'approved', isActive: true }),
        this.eventModel.countDocuments({ attendees: userObjectId, isActive: true }),
        this.eventModel.countDocuments({
          attendees: userObjectId,
          isActive: true,
          date: { $gte: now },
        }),
        this.paymentModel.countDocuments({ userId: userObjectId, status: 'pending' }),
        this.notificationModel.countDocuments({ userId: userObjectId, read: false }),
      ]);

    const clubMap = new Map();
    [...createdClubs, ...joinedClubs].forEach((club) => {
      clubMap.set(club._id.toString(), {
        id: club._id,
        name: club.name,
        category: club.category,
        status: club.status,
        membersCount: club.members?.length || 0,
        isOwner: String(club.createdBy) === String(userId),
      });
    });

    const [upcomingEvents, announcements] = await Promise.all([
      this.eventModel
        .find({ isActive: true, date: { $gte: now } })
        .select('name date location maxAttendees attendees clubId')
        .populate('clubId', 'name')
        .sort({ date: 1 })
        .limit(4)
        .lean(),
      this.announcementModel
        .find({ isActive: true })
        .select('message club createdAt')
        .populate('club', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    return {
      stats: {
        availableClubs,
        clubsOwned: createdClubs.length,
        joinedClubs: clubMap.size,
        registeredEvents,
        upcomingRegistrations,
        pendingPayments,
        unreadNotifications,
      },
      myClubs: Array.from(clubMap.values()).slice(0, 5),
      upcomingEvents: upcomingEvents.map((event: any) => ({
        id: event._id,
        name: event.name,
        date: event.date,
        location: event.location,
        clubName: event.clubId?.name || 'Campus event',
        attendeesCount: event.attendees?.length || 0,
        maxAttendees: event.maxAttendees || 0,
      })),
      announcements: announcements.map((announcement: any) => ({
        id: announcement._id,
        message: announcement.message,
        clubName: announcement.club?.name || '',
        createdAt: announcement.createdAt,
      })),
    };
  }
}
