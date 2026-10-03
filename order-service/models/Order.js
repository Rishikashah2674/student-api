const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "userId is required"]
    },
    productId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "productId is required"]
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"]
    },
    totalPrice: {
      type: Number,
      required: [true, "totalPrice is required"],
      min: [0, "totalPrice cannot be negative"]
    },
    userSnapshot: {
      name: String,
      email: String,
      role: String
    },
    productSnapshot: {
      name: String,
      price: Number,
      category: String
    },
    status: {
      type: String,
      default: "CREATED",
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

// Pre-save hook to auto-increment numeric ID (starting at 1001) if not provided
orderSchema.pre("save", async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    const maxOrder = await this.constructor.findOne({ _id: { $type: "number" } }, {}, { sort: { _id: -1 } });
    this._id = maxOrder && typeof maxOrder._id === "number" ? maxOrder._id + 1 : 1001;
  }
});

module.exports = mongoose.model("Order", orderSchema);
