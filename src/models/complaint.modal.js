import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    serviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceType",
      required: true,
    },
    servicePriority: {
      type: String,
      // enum: ["Standard", "Express", "Urgent"],
      required: true,
    },
    pricing: {
      type: Number,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Open","Assigned","InProgress", "Resolved"],
      default: "Open",
    },
    location: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentId: {
      type: String,
    },
    attachmentUrl: {
      type: [String],
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
