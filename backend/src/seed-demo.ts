import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { UserSchema } from './schemas/user.schema';
import { ClubSchema } from './schemas/club.schema';
import { EventSchema } from './schemas/event.schema';
import { AnnouncementSchema } from './schemas/announcement.schema';
import { PaymentSchema } from './schemas/payment.schema';
import { NotificationSchema } from './schemas/notification.schema';
import { FeedbackSchema } from './feedback/feedback.schema';
import { ReportSchema } from './report/report.schema';

dotenv.config();

const DEMO_PASSWORD = 'CampusHubDemo2026!';
const DEMO_ACCOUNTS = {
  admin: 'demo.admin@campushub.test',
  student: 'alex.morgan@campushub.test',
  organizer: 'jordan.lee@campushub.test',
  member: 'samira.khan@campushub.test',
};

const daysFromNow = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const model = <T>(name: string, schema: mongoose.Schema) =>
  mongoose.models[name] || mongoose.model<T>(name, schema);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required to seed demo data');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  const User = model<any>('User', UserSchema);
  const Club = model<any>('Club', ClubSchema);
  const Event = model<any>('Event', EventSchema);
  const Announcement = model<any>('Announcement', AnnouncementSchema);
  const Payment = model<any>('Payment', PaymentSchema);
  const Notification = model<any>('Notification', NotificationSchema);
  const Feedback = model<any>('Feedback', FeedbackSchema);
  const Report = model<any>('Report', ReportSchema);

  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = await Promise.all([
    User.findOneAndUpdate(
      { email: DEMO_ACCOUNTS.admin },
      { $set: { firstName: 'Demo', lastName: 'Administrator', password, role: 'admin', isActive: true, department: 'Student Affairs', bio: 'Demo administrator account for reviewing CampusHub moderation tools.' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    User.findOneAndUpdate(
      { email: DEMO_ACCOUNTS.student },
      { $set: { firstName: 'Alex', lastName: 'Morgan', password, role: 'user', isActive: true, department: 'Computer Science', year: '3rd Year', studentId: 'DEMO-1001', bio: 'Curious about technology, debate and community building.' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    User.findOneAndUpdate(
      { email: DEMO_ACCOUNTS.organizer },
      { $set: { firstName: 'Jordan', lastName: 'Lee', password, role: 'user', isActive: true, department: 'Business Administration', year: '4th Year', studentId: 'DEMO-1002', bio: 'Event organizer and campus community builder.' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    User.findOneAndUpdate(
      { email: DEMO_ACCOUNTS.member },
      { $set: { firstName: 'Samira', lastName: 'Khan', password, role: 'user', isActive: true, department: 'Media Studies', year: '2nd Year', studentId: 'DEMO-1003', bio: 'Photographer, volunteer and lifelong learner.' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
  ]);

  const [admin, student, organizer, member] = users;
  const clubData = [
    ['Campus Robotics Lab', 'Build autonomous robots, compete nationally and learn from peers.', 'Technology', organizer._id, 'Wednesday · 5:00 PM', 'Innovation Hub'],
    ['Public Speaking Society', 'Practice persuasive speaking, debate current issues and grow confidence.', 'Academic', student._id, 'Thursday · 4:30 PM', 'Room A-204'],
    ['Creative Arts Collective', 'A welcoming space for photography, illustration, music and exhibitions.', 'Arts & Culture', member._id, 'Saturday · 11:00 AM', 'Arts Studio'],
    ['Green Campus Initiative', 'Turn sustainability ideas into practical projects across campus.', 'Community', student._id, 'Monday · 3:30 PM', 'Eco Garden'],
  ];

  const clubs: any[] = [];
  for (const [name, description, category, createdBy, meetingTime, location] of clubData) {
    const owner = createdBy as Types.ObjectId;
    const existing = await Club.findOneAndUpdate(
      { name },
      { $set: { description, category, createdBy: owner, status: 'approved', isActive: true, meetingTime, location, maxMembers: 120, tags: [String(category).toLowerCase(), 'campus', 'demo'], contactEmail: 'hello@campushub.test', approvedAt: new Date(), approvedBy: admin._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    clubs.push(existing);
  }

  await Club.updateOne({ _id: clubs[0]._id }, { $set: { members: [organizer._id, student._id, member._id] } });
  await Club.updateOne({ _id: clubs[1]._id }, { $set: { members: [student._id, member._id], memberApplications: [{ userId: organizer._id, status: 'pending', appliedAt: new Date() }] } });
  await Club.updateOne({ _id: clubs[2]._id }, { $set: { members: [member._id, student._id] } });
  await Club.updateOne({ _id: clubs[3]._id }, { $set: { members: [student._id, organizer._id] } });

  const eventData = [
    ['Robotics Open Lab', 'Drop in for a guided robotics build session. Beginners are welcome.', daysFromNow(3, 17), 'Innovation Hub · Lab 2', clubs[0]._id, organizer._id, false, 0, 80],
    ['Inter-University Debate Night', 'A friendly public debate evening with teams from across the city.', daysFromNow(8, 18), 'Main Auditorium', clubs[1]._id, student._id, true, 250, 200],
    ['Portraits of Campus', 'A photography walk and portfolio review led by senior members.', daysFromNow(14, 11), 'Arts Studio', clubs[2]._id, member._id, false, 0, 40],
    ['Green Campus Planning Workshop', 'Help shape this semester’s sustainability projects and volunteer calendar.', daysFromNow(20, 15), 'Eco Garden', clubs[3]._id, student._id, false, 0, 60],
    ['Welcome Mixer · Past Event', 'A previous community mixer kept as sample history for the dashboard.', daysFromNow(-12, 16), 'Student Center', clubs[0]._id, organizer._id, false, 0, 100],
  ];

  const events: any[] = [];
  for (const [name, description, date, location, clubId, createdBy, isPaid, price, maxAttendees] of eventData) {
    const existing = await Event.findOneAndUpdate(
      { name },
      { $set: { description, date, location, clubId, createdBy, isActive: true, isPaid, price, currency: 'BDT', maxAttendees, attendees: [student._id, member._id] } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    events.push(existing);
  }

  const announcements = [
    ['Applications are open for the Spring Campus Showcase 🎨', clubs[2]._id, member._id],
    ['Volunteer registration is now open for Green Campus Week 🌱', clubs[3]._id, student._id],
    ['Robotics Open Lab welcomes beginners this Wednesday 🤖', clubs[0]._id, organizer._id],
    ['Debate Night teams have been published. Check your event details.', clubs[1]._id, student._id],
  ];
  for (const [message, club, createdBy] of announcements) {
    await Announcement.findOneAndUpdate(
      { message },
      { $set: { message, club, createdBy, isActive: true, likes: 3, likedBy: [student._id, member._id, organizer._id] } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  await Payment.findOneAndUpdate(
    { transactionId: 'DEMO-PAYMENT-001' },
    { $set: { userId: student._id, eventId: events[1]._id, clubId: clubs[1]._id, amount: 250, currency: 'BDT', status: 'pending', paymentMethod: 'digital_wallet', transactionId: 'DEMO-PAYMENT-001', notes: 'Demo payment awaiting admin review.' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Payment.findOneAndUpdate(
    { transactionId: 'DEMO-PAYMENT-002' },
    { $set: { userId: member._id, eventId: events[1]._id, clubId: clubs[1]._id, amount: 250, currency: 'BDT', status: 'approved', paymentMethod: 'bank_transfer', transactionId: 'DEMO-PAYMENT-002', approvedBy: admin._id, approvedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const notificationData = [
    [student._id, 'Welcome to CampusHub', 'Explore clubs, events and announcements curated for your campus.', 'system', 'info', false, '/dashboard'],
    [student._id, 'Payment needs review', 'Your Debate Night payment is waiting for administrator review.', 'payment', 'warning', false, '/payment-history'],
    [member._id, 'Event reminder', 'Portraits of Campus is coming up soon.', 'event', 'info', false, '/my-events'],
    [organizer._id, 'Club approved', 'Campus Robotics Lab is now visible to the campus community.', 'club', 'success', true, '/manage-club'],
  ];
  for (const [userId, title, message, type, priority, read, actionUrl] of notificationData) {
    await Notification.findOneAndUpdate(
      { userId, title, message },
      { $set: { userId, title, message, type, priority, read, sent: true, actionUrl, actionText: 'View details', channels: { email: false, push: false, inApp: true } } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  await Feedback.findOneAndUpdate(
    { userId: member._id, targetType: 'club', targetId: clubs[0]._id },
    { $set: { rating: 5, comment: 'The open lab is welcoming and the organizers make it easy for beginners to join.', category: 'organization', isAnonymous: false, isVerified: true, status: 'approved', reviewedBy: admin._id, adminResponse: 'Thank you for the thoughtful feedback!', respondedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Feedback.findOneAndUpdate(
    { userId: student._id, targetType: 'event', targetId: events[1]._id },
    { $set: { rating: 4, comment: 'Great format and a very friendly group of participants.', category: 'communication', isAnonymous: false, isVerified: false, status: 'pending' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Report.findOneAndUpdate(
    { reportedBy: member._id, targetId: events[1]._id, type: 'event' },
    { $set: { category: 'other', description: 'Demo report for testing the moderation workflow. No action is required.', additionalInfo: 'This record was generated by the CampusHub demo seed.', status: 'pending', priority: 2, isDeleted: false } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await User.updateOne({ _id: student._id }, { $set: { joinedClubs: clubs.slice(0, 3).map((club) => String(club._id)), settings: { theme: 'light', language: 'en', interests: ['technology', 'arts', 'community'], emailNotifications: true, pushNotifications: true, clubNotifications: true, eventNotifications: true } } });
  await User.updateOne({ _id: organizer._id }, { $set: { createdClubs: [String(clubs[0]._id)] } });
  await User.updateOne({ _id: member._id }, { $set: { joinedClubs: [String(clubs[0]._id), String(clubs[2]._id)] } });

  console.log('Demo data seeded successfully.');
  console.log(`Demo password: ${DEMO_PASSWORD}`);
  Object.entries(DEMO_ACCOUNTS).forEach(([role, email]) => console.log(`${role}: ${email}`));
}

seed()
  .catch((error) => {
    console.error('Demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
