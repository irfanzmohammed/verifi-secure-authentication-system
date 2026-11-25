
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IPasskey {
  userId: Types.ObjectId;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passkeySchema = new Schema<IPasskey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    credentialId: {
      type: String,
      required: true,
      unique: true,
    },

    publicKey: {
      type: String,
      required: true,
    },

    counter: {
      type: Number,
      required: true,
      default: 0,
    },

    transports: {
      type: [String],
      default: [],
    },

    deviceType: {
      type: String,
    },

    backedUp: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Passkey: Model<IPasskey> =
  mongoose.models.Passkey ||
  mongoose.model<IPasskey>("Passkey", passkeySchema);

export default Passkey;
