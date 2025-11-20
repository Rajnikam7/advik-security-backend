import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    serviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceType",
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
      enum: ["Open", "Resolved"],
      default: "Open",
    },
    location:{type:String,},
    paymentStatus:{

    },
    assets:[]
  },
  { timestamps: true }
);
export default mongoose.model("Complaint", userSchema);
