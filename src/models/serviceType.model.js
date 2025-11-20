import mongoose, { Schema } from "mongoose"; 

const servicePrioritySchema = new Schema({
  servicePriority: { 
    type: String,
    required: true,
    enum: ['Standard', 'Express', 'Urgent'], 
  },
  pricing: { 
    type: Number,
    required: true,
  },
});

const serviceTypeSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    servicePriorities: [servicePrioritySchema], 
    icon: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceType", serviceTypeSchema);