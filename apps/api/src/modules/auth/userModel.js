import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model('User', userSchema);
