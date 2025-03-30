import { boolean, date, index, integer, json, pgEnum, pgTable, primaryKey, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Type Table
export const userTypes = pgTable('user_type', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 500 }).notNull().unique(),
});

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 500 }).notNull().unique(),
  fullName: varchar('full_name', { length: 500 }).notNull(),
  profileImage: varchar('profile_image', { length: 500 }).notNull(),
  password: varchar('password', { length: 500 }).notNull(),
  auth: varchar('auth', { length: 500 }).notNull(),
  active: integer('active').default(1).notNull(),
  token: text('token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userTypeId: integer('user_type').notNull(),
  referralCode: varchar('referral_code', { length: 20 }),
  referredBy: integer('referred_by'),
  latitude: varchar('latitude', { length: 500 }).notNull(),
  longitude: varchar('longitude', { length: 500 }).notNull(),
  cnicFrontImg: varchar('cnic_front_img', { length: 500 }).notNull(),
  cnicBackImg: varchar('cnic_back_img', { length: 500 }).notNull(),
  cnicNum: varchar('cnic_num', { length: 500 }).notNull(),
  notificationPermission: varchar('notification_permission', { length: 20 }).default('default'),
  deviceToken: varchar('device_token', { length: 500 }),
}, (table) => {
  return {
    phoneNumberIdx: index('phone_number_idx').on(table.phoneNumber),
    userTypeIdx: index('user_type_idx').on(table.userTypeId),
    referredByIdx: index('referred_by_idx').on(table.referredBy),
  };
});

// Categories Table
export const categories = pgTable('category', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
});

// SubCategories Table
export const subCategories = pgTable('sub_category', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  categoryId: integer('category_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    subCatCategoryIdx: index('sub_cat_category_idx').on(table.categoryId),
  };
});

// Services Table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  charges: integer('charges').default(0).notNull(),
  categoryId: integer('category_id').notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    serviceCategoryIdx: index('service_category_idx').on(table.categoryId),
    serviceUserIdx: index('service_user_idx').on(table.userId),
  };
});

// Service Images Table
export const serviceImages = pgTable('service_images', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').notNull(),
  imageName: varchar('image_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    serviceImagesIdx: index('service_images_idx').on(table.serviceId),
  };
});

// Service SubCategories Table
export const serviceSubCategories = pgTable('service_subCategories', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').notNull(),
  subCategoryId: integer('sub_category_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    serviceSubCatsIdx: index('service_sub_cats_idx').on(table.serviceId),
    subCategoryIdx: index('sub_category_idx').on(table.subCategoryId),
  };
});

// Task Status Table
export const statuses = pgTable('status', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Task Assignments Table
export const taskAssigns = pgTable('task_assigns', {
  id: serial('id').primaryKey(),
  workerId: varchar('worker_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  serviceId: integer('service_id').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  estTime: integer('est_time').notNull(),
  totalAmount: integer('total_amount').notNull(),
  offerExpirationDate: timestamp('offer_expiration_date').notNull(),
  statusId: integer('status_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  audioName: varchar('audio_name', { length: 500 }).notNull(),
  cnic: varchar('cnic', { length: 500 }).notNull(),
  arrivalTime: timestamp('arrival_time').notNull(),
}, (table) => {
  return {
    taskWorkerIdx: index('task_worker_idx').on(table.workerId),
    taskUserIdx: index('task_user_idx').on(table.userId),
    taskServiceIdx: index('task_service_idx').on(table.serviceId),
    taskStatusIdx: index('task_status_idx').on(table.statusId),
  };
});

// Reviews Table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').notNull(),
  rating: integer('rating').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    workerUserIdx: unique('worker_user_idx').on(table.workerId, table.userId),
    reviewWorkerIdx: index('review_worker_idx').on(table.workerId),
    reviewUserIdx: index('review_user_idx').on(table.userId),
  };
});

// Chat List Table
export const chatList = pgTable('chat_list', {
  id: serial('id').primaryKey(),
  user1: varchar('user1', { length: 500 }).notNull(),
  user2: varchar('user2', { length: 500 }).notNull(),
  timeStamp: timestamp('time_stamp').defaultNow().notNull(),
  deletedBy: varchar('deleted_by', { length: 500 }).default(''),
  lastMsg: text('last_msg').notNull(),
  type: text('type').notNull(),
}, (table) => {
  return {
    usersIdx: unique('users_idx').on(table.user1, table.user2),
  };
});

// Notifications Table
export const notifications = pgTable('notification', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  type: integer('type').notNull(),
  timeStamp: timestamp('time_stamp').defaultNow().notNull(),
  username: varchar('username', { length: 500 }).notNull(),
  usernameNotifier: varchar('username_notifier', { length: 500 }).notNull(),
  postId: integer('post_id').notNull(),
  isRead: integer('is_read').default(0),
});

// Service Boosted Table
export const serviceBoosted = pgTable('service_boosted', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').notNull(),
  daySelected: integer('day_selected').notNull(),
  paymentMethod: varchar('payment_method', { length: 500 }).notNull(),
  status: integer('status').default(1).notNull(),
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    boostedServiceIdx: index('boosted_service_idx').on(table.serviceId),
  };
});

// Payment Methods Table
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  serviceBoostedId: integer('service_boosted_id').notNull(),
  paymentMethod: varchar('payment_method', { length: 500 }).notNull(),
  amount: varchar('amount', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    serviceBoostedIdx: index('service_boosted_idx').on(table.serviceBoostedId),
  };
});

// Countries Table
export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  status: integer('status').default(1).notNull(),
});

// Cities Table
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  climate: text('climate').notNull(),
  plane: text('plane').notNull(),
  bus: text('bus').notNull(),
  train: text('train').notNull(),
  stateId: integer('state_id').notNull(),
  stateCode: varchar('state_code', { length: 255 }).notNull(),
  countryId: integer('country_id').notNull(),
  status: integer('status').default(1).notNull(),
  latitude: varchar('latitude', { length: 15 }).notNull(),
  longitude: varchar('longitude', { length: 15 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
}, (table) => {
  return {
    stateIdx: index('state_idx').on(table.stateId),
    countryIdx: index('country_idx').on(table.countryId),
  };
});

// Admin Table
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 500 }).notNull(),
  password: varchar('password', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// App Settings Table
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  label: varchar('label', { length: 500 }).notNull(),
  value: varchar('value', { length: 500 }).notNull(),
});

// Create insert schemas for each table

// User Types
export const insertUserTypeSchema = createInsertSchema(userTypes).omit({ id: true });
export type InsertUserType = z.infer<typeof insertUserTypeSchema>;
export type UserType = typeof userTypes.$inferSelect;

// Users
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Register Schema with validation
export const registerUserSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  fullName: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  userTypeId: z.number().int().min(1).max(3),
  referralCode: z.string().optional(),
  notificationPermission: z.string().optional().default("default"),
  deviceToken: z.string().optional(),
  profileImage: z.string().optional(),
  imageData: z.string().optional(),
  imageName: z.string().optional(),
  latitude: z.string().optional().default("0"),
  longitude: z.string().optional().default("0"),
  cnicFrontImg: z.string().optional().default(""),
  cnicBackImg: z.string().optional().default(""),
  cnicNum: z.string().optional().default(""),
});
export type RegisterUser = z.infer<typeof registerUserSchema>;

// User Login Schema
export const loginUserSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  password: z.string().min(6).max(100),
});
export type LoginUser = z.infer<typeof loginUserSchema>;

// Service
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Service Images
export const insertServiceImageSchema = createInsertSchema(serviceImages).omit({ id: true, createdAt: true });
export type InsertServiceImage = z.infer<typeof insertServiceImageSchema>;
export type ServiceImage = typeof serviceImages.$inferSelect;

// Task Assign
export const insertTaskAssignSchema = createInsertSchema(taskAssigns).omit({ id: true, createdAt: true });
export type InsertTaskAssign = z.infer<typeof insertTaskAssignSchema>;
export type TaskAssign = typeof taskAssigns.$inferSelect;

// Review
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Chat
export const insertChatSchema = createInsertSchema(chatList).omit({ id: true, timeStamp: true });
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chatList.$inferSelect;

// Notification
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, timeStamp: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Service Boosted
export const insertServiceBoostedSchema = createInsertSchema(serviceBoosted).omit({ id: true, createdAt: true });
export type InsertServiceBoosted = z.infer<typeof insertServiceBoostedSchema>;
export type ServiceBoosted = typeof serviceBoosted.$inferSelect;

// Status
export const insertStatusSchema = createInsertSchema(statuses).omit({ id: true, createdAt: true });
export type InsertStatus = z.infer<typeof insertStatusSchema>;
export type Status = typeof statuses.$inferSelect;

// Category
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// SubCategory
export const insertSubCategorySchema = createInsertSchema(subCategories).omit({ id: true, createdAt: true });
export type InsertSubCategory = z.infer<typeof insertSubCategorySchema>;
export type SubCategory = typeof subCategories.$inferSelect;