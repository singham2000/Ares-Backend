const notificationModel = require("../models/notificationModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");


exports.getAllNotifications = catchAsyncError(async (req, res, next) => {
  console.log("Get all Notification");
  const { userId } = req;
  console.log(userId);
  const notifications = await notificationModel.find({ user: userId });
  const unreadCounts = await notificationModel.countDocuments({ seen: false });
  res.status(200).json({ notifications, unreadCounts });
});

exports.getNotification = catchAsyncError(async (req, res, next) => {
  console.log("Get Single Notification");
  const { userId } = req;
  const {
    params: { id },
  } = req;
  console.log(id);
  if (!id) {
    return next(new ErrorHandler("Please provide notification id", 400));
  }

  const notification = await notificationModel.findOne({
    user: userId,
    _id: id,
  });
  console.log(notification);
  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  res.status(200).json({ notification });
});

exports.updateNotification = catchAsyncError(async (req, res, next) => {
  console.log("Update Notification");
  const { userId } = req;
  const {
    params: { id },
  } = req;
  if (!id) {
    return next(ErrorHandler("Please provide Notification id in params"), 400);
  }
  const notification = await notificationModel.findOne({
    _id: id,
    user: userId,
  });

  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  notification.seen = true;
  await notification.save();
  res.status(200).json({ message: "Notification marked as seen" });
});

exports.markAllRead = catchAsyncError(async (req, res, next) => {
  console.log("Mark all notifications as read");
  const { userId } = req;

  await notificationModel.updateMany(
    { user: userId },
    { seen: true }
  );
  res.status(200).json({ success: true });
});

exports.deleteNotification = catchAsyncError(async (req, res, next) => {
  console.log("Delete Notification");
  const { id } = req.params;
  if (!id) {
    return next(ErrorHandler("Please provide Notification id in params"), 400);
  }
  const deleted = await notificationModel.findByIdAndDelete(id);
  if (!deleted) {
    return next(new ErrorHandler("Notification not found", 404));
  }
  res.status(200).json({ message: "Notification Deleted Successfully" });
});
