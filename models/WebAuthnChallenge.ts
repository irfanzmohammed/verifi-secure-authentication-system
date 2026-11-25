
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IWebAuthnChallenge {
  userId: Types.ObjectId;
  challenge: string;
  purpose: "registration" | "authentication";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webAuthnChallengeSchema = new Schema<IWebAuthnChallenge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    challenge: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["registration", "authentication"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

webAuthnChallengeSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const WebAuthnChallenge: Model<IWebAuthnChallenge> =
  mongoose.models.WebAuthnChallenge ||
  mongoose.model<IWebAuthnChallenge>(
    "WebAuthnChallenge",
    webAuthnChallengeSchema
  );

export default WebAuthnChallenge;
