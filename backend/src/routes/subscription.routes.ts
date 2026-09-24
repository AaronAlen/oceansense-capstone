// ==============================================================================
// OceanSense — Commercial Fisherman & Maritime SaaS Subscription System
// Demonstrates: Payment Gateway Integration, Subscription Lifecycle & Feature Gating
// ==============================================================================

import { Router, Request, Response } from 'express';
import { ENV } from '../config/env.js';

const router = Router();

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'BASIC_COASTAL' | 'PRO_TRAWLER' | 'ENTERPRISE_FLEET';
  priceINR: number;
  priceUSD: number;
  interval: 'month' | 'year';
  popular?: boolean;
  description: string;
  features: string[];
  entitlements: {
    canAccess3DTwin: boolean;
    canAccessLiveBiomassGPS: boolean;
    canAccessOptimalNetDepth: boolean;
    canAccessAcousticAlerts: boolean;
    maxRegisteredVessels: number;
    smsAlertsFrequency: 'DAILY_SUMMARY' | 'REALTIME_5NM' | 'INSTANT_UNLIMITED';
    rawApiExport: boolean;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_coastal_basic',
    name: 'Coastal Fisher (நாட்டுப்படகு)',
    tier: 'BASIC_COASTAL',
    priceINR: 499,
    priceUSD: 9.99,
    interval: 'month',
    description: 'Essential coastal marine advisories and daily biomass forecasts for small boat operators.',
    features: [
      'Daily 4:00 AM SMS/WhatsApp fish school forecasts',
      'Sea surface temperature & thermocline depth',
      'Wave height & monsoon weather safety alerts',
      'Single vessel registration',
    ],
    entitlements: {
      canAccess3DTwin: false,
      canAccessLiveBiomassGPS: false,
      canAccessOptimalNetDepth: true,
      canAccessAcousticAlerts: false,
      maxRegisteredVessels: 1,
      smsAlertsFrequency: 'DAILY_SUMMARY',
      rawApiExport: false,
    },
  },
  {
    id: 'plan_pro_trawler',
    name: 'Commercial Trawler Pro (விசைப்படகு)',
    tier: 'PRO_TRAWLER',
    priceINR: 2499,
    priceUSD: 39.0,
    interval: 'month',
    popular: true,
    description: 'Full tactical subsea intelligence for deep-sea trawlers. Saves up to 35% in diesel fuel costs.',
    features: [
      'Full access to 3D Fisherman Digital Twin & 2D Radar',
      'Real-time live GPS coordinates to swimming fish schools',
      'Recommended net deployment depth advisory',
      'Species identification (Bluefin Tuna, Mackerel, Sardines)',
      'Estimated biomass tonnage & schooling direction vectors',
      'Proximity SMS/VHF alerts within 5 nautical miles',
      'Up to 3 registered trawler vessels',
    ],
    entitlements: {
      canAccess3DTwin: true,
      canAccessLiveBiomassGPS: true,
      canAccessOptimalNetDepth: true,
      canAccessAcousticAlerts: true,
      maxRegisteredVessels: 3,
      smsAlertsFrequency: 'REALTIME_5NM',
      rawApiExport: false,
    },
  },
  {
    id: 'plan_enterprise_fleet',
    name: 'Harvester Fleet & Export (பெருநிறுவனம்)',
    tier: 'ENTERPRISE_FLEET',
    priceINR: 14999,
    priceUSD: 199.0,
    interval: 'month',
    description: 'Fleet-wide telemetry and raw subsea acoustic sensor streams for commercial export conglomerates.',
    features: [
      'Fleet dashboard tracking unlimited vessels simultaneously',
      'Raw subsea acoustic API & bathymetric CSV/GeoJSON export',
      'Automated AUV drone dispatch for lost net / gear recovery',
      'Satellite modem & Marine VHF data stream uplink',
      'Dedicated maritime fisheries biologist support',
      'Custom geo-fence intrusion & tamper alarms',
    ],
    entitlements: {
      canAccess3DTwin: true,
      canAccessLiveBiomassGPS: true,
      canAccessOptimalNetDepth: true,
      canAccessAcousticAlerts: true,
      maxRegisteredVessels: 50,
      smsAlertsFrequency: 'INSTANT_UNLIMITED',
      rawApiExport: true,
    },
  },
];

// In-memory active subscription state (default to PRO_TRAWLER active trial for seamless demo)
let activeSubscription = {
  subscriptionId: 'SUB-OS-2026-9812',
  userId: 'usr-fisherman-01',
  vesselName: 'Nordic Runner (TN-08-MM-4421)',
  planId: 'plan_pro_trawler',
  planName: 'Commercial Trawler Pro',
  status: 'ACTIVE',
  gateway: 'RAZORPAY_UPI',
  billingCurrency: 'INR',
  amountPaid: 2499,
  currentPeriodStart: new Date(Date.now() - 5 * 86400000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 25 * 86400000).toISOString(),
  autoRenew: true,
  estimatedSavings: {
    dieselFuelLiters: 420,
    estimatedCostSavedINR: 38640,
    hoursSavedAtSea: 18.5,
  },
};

// 1. Get all available subscription plans
router.get('/plans', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: SUBSCRIPTION_PLANS,
  });
});

// 2. Get current active subscription details
router.get('/status', (req: Request, res: Response) => {
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === activeSubscription.planId) || SUBSCRIPTION_PLANS[1];
  res.json({
    success: true,
    data: {
      ...activeSubscription,
      plan: currentPlan,
      isSubscribed: activeSubscription.status === 'ACTIVE',
    },
  });
});

// 3. Initiate payment checkout session (Razorpay / Stripe Order)
router.post('/create-checkout', (req: Request, res: Response) => {
  const { planId, gateway = 'RAZORPAY_UPI' } = req.body;
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Invalid subscription plan ID' });
  }

  const orderId = `order_${gateway.toLowerCase()}_${Date.now().toString(36)}`;
  
  res.json({
    success: true,
    data: {
      orderId,
      amount: plan.priceINR * 100, // Amount in paise
      currency: 'INR',
      planId: plan.id,
      planName: plan.name,
      gateway,
      keyId: ENV.RAZORPAY_KEY_ID,
      paymentLink: `https://${ENV.RAZORPAY_PAYMENT_LINK}`,
      customer: {
        name: 'Capt. Sundaram',
        phone: '+91 98401 22345',
        email: 'fisherman.sundaram@oceansense.maritime',
      },
      upiQrString: `upi://pay?pa=aaron5317@razorpay&pn=OceanSenseMaritime&am=${plan.priceINR}&cu=INR&tn=Sub_${plan.id}`,
    },
  });
});

// 4. Verify payment and instantly activate subscription
router.post('/verify-payment', (req: Request, res: Response) => {
  const { planId, paymentId, orderId } = req.body;
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[1];

  activeSubscription = {
    ...activeSubscription,
    subscriptionId: `SUB-OS-${Date.now().toString(36).toUpperCase()}`,
    planId: plan.id,
    planName: plan.name,
    status: 'ACTIVE',
    gateway: 'RAZORPAY_UPI',
    amountPaid: plan.priceINR,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    autoRenew: true,
  };

  res.json({
    success: true,
    message: `Subscription successfully activated for ${plan.name}`,
    data: {
      ...activeSubscription,
      receiptNumber: `REC-${Date.now()}`,
      paymentId: paymentId || `pay_${Date.now()}`,
      orderId: orderId || `order_${Date.now()}`,
    },
  });
});

// 5. Switch / cancel subscription
router.post('/switch-plan', (req: Request, res: Response) => {
  const { planId } = req.body;
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }

  activeSubscription.planId = plan.id;
  activeSubscription.planName = plan.name;
  activeSubscription.amountPaid = plan.priceINR;

  res.json({
    success: true,
    message: `Switched plan to ${plan.name}`,
    data: activeSubscription,
  });
});

export default router;
