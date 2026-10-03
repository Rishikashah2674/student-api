const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    category: {
      type: String,
      default: "General",
      trim: true
    },
    stock: {
      type: Number,
      default: 100,
      min: [0, "Stock cannot be negative"]
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

// Pre-save hook to auto-increment numeric ID (starting at 501) if not provided
productSchema.pre("save", async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    const maxProduct = await this.constructor.findOne({ _id: { $type: "number" } }, {}, { sort: { _id: -1 } });
    this._id = maxProduct && typeof maxProduct._id === "number" ? maxProduct._id + 1 : 501;
  }
});

module.exports = mongoose.model("Product", productSchema);
