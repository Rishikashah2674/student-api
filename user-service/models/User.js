const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      default: "student",
      trim: true
    },
    department: {
      type: String,
      default: "Computer Science",
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      }
    }
  }
);

// Pre-save hook to auto-increment numeric ID (starting at 101) if not provided
userSchema.pre("save", async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    const maxUser = await this.constructor.findOne({ _id: { $type: "number" } }, {}, { sort: { _id: -1 } });
    this._id = maxUser && typeof maxUser._id === "number" ? maxUser._id + 1 : 101;
  }
});

module.exports = mongoose.model("User", userSchema);
