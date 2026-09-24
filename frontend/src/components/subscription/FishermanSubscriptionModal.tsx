// ==============================================================================
// OceanSense — Fisherman Subscription & Payment Checkout Modal
// Demonstrates: SaaS Monetization, Tier Gating, UPI/Card Checkout & Fuel ROI Metrics
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Zap, Anchor, QrCode, CreditCard, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface FishermanSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated?: (plan: any) => void;
}

export const FishermanSubscriptionModal: React.FC<FishermanSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionUpdated,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_pro_trawler');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'SELECT' | 'PAY' | 'SUCCESS'>('SELECT');
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch plans and current subscription status
      fetch('/api/subscriptions/plans')
        .then(r => r.json())
        .then(d => { if (d.success) setPlans(d.data); })
        .catch(console.error);

      fetch('/api/subscriptions/status')
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setCurrentSub(d.data);
            if (d.data?.planId) setSelectedPlanId(d.data.planId);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartCheckout = () => {
    setCheckoutStep('PAY');
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/subscriptions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          orderId: `ORD_${Date.now()}`,
          paymentId: `PAY_UPI_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReceipt(data.data);
        setCurrentSub(data.data);
        setCheckoutStep('SUCCESS');
        onSubscriptionUpdated?.(data.data);
      }
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        backgroundColor: '#0B1320',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1E293B',
          background: 'linear-gradient(90deg, #091526, #0D1E36)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(0, 242, 254, 0.15)',
                color: '#00F2FE',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}>
                OCEANSENSE COMMERCIAL MARITIME SAAS
              </span>
              <span style={{ color: '#00E699', fontSize: '10px', fontFamily: 'monospace' }}>
                ● INSTANT UPI / RUPAY ACTIVATION
              </span>
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#FFF' }}>
              Commercial Fisherman Tactical Subscriptions
            </h2>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              Access live subsea sonar biomass coordinates, 3D fleet navigation, and fuel-saving net advisories
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* STEP 1: PLAN SELECTION */}
          {checkoutStep === 'SELECT' && (
            <div>
              {/* ROI Benefit Banner */}
              <div style={{
                background: 'linear-gradient(90deg, rgba(0, 230, 153, 0.1), rgba(0, 242, 254, 0.08))',
                border: '1px solid rgba(0, 230, 153, 0.3)',
                borderRadius: '10px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#00E699', color: '#000', borderRadius: '50%', padding: '6px' }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                      Proven 35% Diesel Fuel Savings per Voyage
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Commercial trawlers save average ₹38,640/mo by eliminating blind ocean scouting.
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#00E699', fontFamily: 'monospace' }}>
                    ROI: 15.4x
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>Net payback in 2 days</div>
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}>
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const isCurrent = currentSub?.planId === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      style={{
                        background: isSelected ? 'rgba(0, 242, 254, 0.08)' : '#0F1A2A',
                        border: isSelected ? '2px solid #00F2FE' : '1px solid #1E293B',
                        borderRadius: '12px',
                        padding: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {p.popular && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '16px',
                          background: 'linear-gradient(90deg, #F72585, #7209B7)',
                          color: '#FFF',
                          fontSize: '9px',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          boxShadow: '0 2px 8px rgba(247, 37, 133, 0.4)',
                        }}>
                          MOST POPULAR // மீனவர்கள் தேர்வு
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#00F2FE' : '#FFF' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', minHeight: '32px' }}>
                          {p.description}
                        </div>

                        <div style={{ margin: '14px 0', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '26px', fontWeight: 900, color: '#FFF', fontFamily: 'monospace' }}>
                            ₹{p.priceINR}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}> / month</span>
                          <div style={{ fontSize: '10px', color: '#00E699' }}>
                            ~${p.priceUSD} USD
                          </div>
                        </div>

                        {/* Feature Checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {p.features.map((f: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#CBD5E1' }}>
                              <Check size={14} color="#00E699" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '18px' }}>
                        {isCurrent ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '8px',
                            background: 'rgba(0, 230, 153, 0.15)',
                            color: '#00E699',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}>
                            ✓ ACTIVE PLAN
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlanId(p.id);
                              handleStartCheckout();
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: isSelected ? '#00F2FE' : 'transparent',
                              color: isSelected ? '#000' : '#00F2FE',
                              border: isSelected ? 'none' : '1px solid #00F2FE',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Select {p.name.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Continue Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#94A3B8',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartCheckout}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(90deg, #00F2FE, #4FACFE)',
                    border: 'none',
                    color: '#000',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
                  }}
                >
                  Proceed to Payment (₹{selectedPlan?.priceINR}) <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHECKOUT & PAYMENT GATEWAY */}
          {checkoutStep === 'PAY' && (
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
              <div style={{
                background: '#0F1A2A',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>SELECTED PLAN</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>{selectedPlan?.name}</div>
                    <div style={{ fontSize: '11px', color: '#00E699' }}>1 Month License // 30 Days</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>TOTAL AMOUNT</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#00F2FE', fontFamily: 'monospace' }}>
                      ₹{selectedPlan?.priceINR}
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '10px' }}>
                    SELECT PAYMENT METHOD
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => setPaymentMethod('UPI')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: paymentMethod === 'UPI' ? '2px solid #00F2FE' : '1px solid #334155',
                        background: paymentMethod === 'UPI' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                        color: paymentMethod === 'UPI' ? '#00F2FE' : '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <QrCode size={18} /> UPI / GPay / PhonePe
                    </button>
                    <button
                      onClick={() => setPaymentMethod('CARD')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: paymentMethod === 'CARD' ? '2px solid #00F2FE' : '1px solid #334155',
                        background: paymentMethod === 'CARD' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                        color: paymentMethod === 'CARD' ? '#00F2FE' : '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <CreditCard size={18} /> RuPay / Visa / Master
                    </button>
                  </div>
                </div>

                {/* Simulated UPI QR Code */}
                {paymentMethod === 'UPI' ? (
                  <div style={{
                    marginTop: '20px',
                    textAlign: 'center',
                    background: '#070C15',
                    borderRadius: '10px',
                    padding: '20px',
                    border: '1px dashed #334155',
                  }}>
                    <div style={{
                      width: '140px',
                      height: '140px',
                      margin: '0 auto 12px auto',
                      background: '#FFF',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {/* SVG Stylized QR */}
                      <svg width="124" height="124" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                        <rect x="3" y="3" width="6" height="6" rx="1" fill="#000" />
                        <rect x="15" y="3" width="6" height="6" rx="1" fill="#000" />
                        <rect x="3" y="15" width="6" height="6" rx="1" fill="#000" />
                        <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM19 19h2v2h-2z" fill="#000" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '12px', color: '#FFF', fontWeight: 700 }}>
                      Scan via GPay, PhonePe, Paytm, or BHIM
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '4px' }}>
                      UPI ID: oceansense@icici (Verified Maritime Merchant)
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '20px',
                    background: '#070C15',
                    borderRadius: '10px',
                    padding: '16px',
                    border: '1px solid #334155',
                  }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>CARD NUMBER</div>
                    <input
                      readOnly
                      value="•••• •••• •••• 4242 (RuPay Kisan Card)"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#0F1A2A',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFF',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        marginBottom: '10px',
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>EXPIRY</div>
                        <input
                          readOnly
                          value="12/28"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#0F1A2A',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#FFF',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>CVV</div>
                        <input
                          readOnly
                          value="•••"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#0F1A2A',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#FFF',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <button
                  onClick={() => setCheckoutStep('SELECT')}
                  style={{
                    padding: '10px 18px',
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#94A3B8',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Back to Plans
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: isProcessing ? '#334155' : 'linear-gradient(90deg, #00E699, #00F2FE)',
                    border: 'none',
                    color: '#000',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: isProcessing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0, 230, 153, 0.4)',
                  }}
                >
                  {isProcessing ? 'Verifying Bank Transaction...' : `Authorize Payment (₹${selectedPlan?.priceINR})`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESSFUL ACTIVATION RECEIPT */}
          {checkoutStep === 'SUCCESS' && (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 230, 153, 0.15)',
                border: '2px solid #00E699',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#00E699',
              }}>
                <Check size={32} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', margin: '0 0 6px 0' }}>
                Subscription Activated!
              </h3>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
                Vessel <strong style={{ color: '#00F2FE' }}>"Nordic Runner"</strong> is now licensed for real-time subsea biomass vectoring.
              </div>

              <div style={{
                background: '#0F1A2A',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid #1E293B',
                textAlign: 'left',
                fontSize: '12px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Plan:</span>
                  <span style={{ color: '#FFF', fontWeight: 700 }}>{receipt?.planName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Subscription ID:</span>
                  <span style={{ color: '#00F2FE', fontFamily: 'monospace' }}>{receipt?.subscriptionId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Payment Gateway:</span>
                  <span style={{ color: '#00E699', fontFamily: 'monospace' }}>RAZORPAY UPI (PAID)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Valid Until:</span>
                  <span style={{ color: '#FFF', fontFamily: 'monospace' }}>
                    {receipt?.currentPeriodEnd ? new Date(receipt.currentPeriodEnd).toLocaleDateString() : '30 Days'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#00F2FE',
                  border: 'none',
                  color: '#000',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Launch 3D Tactical Twin Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
