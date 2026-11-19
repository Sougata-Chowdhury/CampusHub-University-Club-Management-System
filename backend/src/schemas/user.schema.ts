import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  profilePicture?: string;

  @Prop([String])
  joinedClubs?: string[];

  @Prop([String])
  createdClubs?: string[];

  // New profile fields
  @Prop()
  phone?: string;

  @Prop()
  bio?: string;

  @Prop()
  department?: string;

  @Prop()
  year?: string;

  @Prop()
  studentId?: string;

  @Prop()
  lastLogin?: Date;

  @Prop()
  passwordChangedAt?: Date;

  // User settings
  @Prop({
    type: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      clubNotifications: { type: Boolean, default: true },
      eventNotifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, default: 'en' },
      interests: { type: [String], default: [] }
    },
    default: {
      emailNotifications: true,
      pushNotifications: true,
      clubNotifications: true,
      eventNotifications: true,
      theme: 'light',
      language: 'en',
      interests: []
    }
  })
  settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    clubNotifications: boolean;
    eventNotifications: boolean;
    theme: 'light' | 'dark';
    language: string;
    interests: string[];
  };

  // Activity log
  @Prop([{
    id: String,
    activityType: String,
    description: String,
    timestamp: { type: Date, default: Date.now },
    relatedId: String,
    metadata: Object
  }])
  activityLog?: Array<{
    id: string;
    activityType: string;
    description: string;
    timestamp: Date;
    relatedId?: string;
    metadata?: any;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual field for full name
UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are included when converting to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Query indexes for authentication, admin lists and profile lookups.
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });
