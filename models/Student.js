const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    _id: {
      type: Number
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
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be a positive integer"]
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

// Pre-save hook to auto-increment numeric ID (1, 2, 3...)
studentSchema.pre("save", async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    const maxStudent = await this.constructor.findOne({}, {}, { sort: { _id: -1 } });
    this._id = maxStudent && typeof maxStudent._id === "number" ? maxStudent._id + 1 : 1;
  }
});

module.exports = mongoose.model("Student", studentSchema);
