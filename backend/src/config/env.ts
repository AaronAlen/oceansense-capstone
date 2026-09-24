import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/oceansense_db',
  MONGODB_URI: process.env.MONGODB_URI || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'oceansense_jwt_secret_token_change_in_production',
  
  // Digital Twin Simulation
  SIMULATION_DEFAULT_NODES: parseInt(process.env.SIMULATION_DEFAULT_NODES || '4', 10),
  SIMULATION_AREA_KM: parseInt(process.env.SIMULATION_AREA_KM || '10', 10),
  SIMULATION_TICK_HZ: parseInt(process.env.SIMULATION_TICK_HZ || '60', 10),

  // Commercial Fisherman SaaS & Payments
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_PAYMENT_LINK: process.env.RAZORPAY_PAYMENT_LINK || 'https://razorpay.me',

  // Maritime Security Alerts — SMS (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  SMS_ENABLED: process.env.SMS_ENABLED === 'true',

  // Maritime Security Alerts — Email (Gmail SMTP & Brevo)
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || 'aaronbca123@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"OceanSense Maritime Security" <aaronbca123@gmail.com>',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',

  // AI Engines (Groq & Gemini)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // AWS & Cloud Deployment
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  DOCKER_PAT: process.env.DOCKER_PAT || '',
};
