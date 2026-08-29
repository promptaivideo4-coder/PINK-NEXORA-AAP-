// API Routes Index
// This file exports all API handlers for the Pink Nexora App

// Auth routes
import loginHandler from './auth/login';
import signupHandler from './auth/signup';

// Razorpay routes
import createOrderHandler from './razorpay/create-order';
import verifyPaymentHandler from './razorpay/verify-payment';
import webhookHandler from './razorpay/webhook';

// Staff management routes
import staffHandler from './staff/index';

// Bookings routes
import bookingsHandler from './bookings/index';

// Customers routes
import customersHandler from './customers/index';

// Services routes
import servicesHandler from './services/index';

export {
  loginHandler,
  signupHandler,
  createOrderHandler,
  verifyPaymentHandler,
  webhookHandler,
  staffHandler,
  bookingsHandler,
  customersHandler,
  servicesHandler,
};
