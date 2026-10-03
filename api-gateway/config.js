require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  services: {
    user: {
      url: process.env.USER_SERVICE_URL || "http://user-service:3001",
      path: "/users"
    },
    product: {
      url: process.env.PRODUCT_SERVICE_URL || "http://product-service:3002",
      path: "/products"
    },
    order: {
      url: process.env.ORDER_SERVICE_URL || "http://order-service:3003",
      path: "/orders"
    }
  }
};
