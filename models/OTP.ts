
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IOTP {
  userId: Types.ObjectId;
  codeHash: string;
  purpose: "registration" | "login";
  expiresAt: Date;
  attempts: number;
  consumedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    codeHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["registration", "login"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired OTP records.
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const OTP: Model<IOTP> =
  mongoose.models.OTP ||
  mongoose.model<IOTP>("OTP", otpSchema);

export default OTP;
