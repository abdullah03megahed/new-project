import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, Crown, Zap, Star, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionDto {
  planName: string;
  maxListings: number;
  price: number;
  landlordId: number;
  landlordName: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  durationInDays: number | null;
  maxListings: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

// ─── Plans config (IDs match DB: Freemium=4, Basic=8, Professional=11) ────────

const PLANS: Plan[] = [
  {
    id: 4,
    name: 'Freemium',
    price: 0,
    durationInDays: null,
    maxListings: 3,
    description: 'Get started for free',
    features: [
      'Up to 3 listings',
      'Basic listing features',
      'Standard support',
    ],
    icon: <Star className="w-6 h-6" />,
    color: '#717182',
  },
  {
    id: 8,
    name: 'Basic',
    price: 150,
    durationInDays: 30,
    maxListings: 10,
    description: 'Perfect for growing landlords',
    features: [
      'Up to 10 listings',
      'Priority listing placement',
      '30-day plan',
      'Email support',
    ],
    icon: <Zap className="w-6 h-6" />,
    color: '#00A5A7',
    popular: true,
  },
  {
    id: 11,
    name: 'Professional',
    price: 500,
    durationInDays: 90,
    maxListings: 1000,
    description: 'For serious property managers',
    features: [
      'Up to 1,000 listings',
      'Top listing placement',
      '90-day plan',
      'Priority support',
      'Advanced analytics',
    ],
    icon: <Crown className="w-6 h-6" />,
    color: '#FFC759',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSub, setCurrentSub] = useState<SubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const data = await api.get<SubscriptionDto>('/Subscription');
        setCurrentSub(data);
      } catch {
        // No subscription yet — that's fine
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, []);

  if (!user || user.type !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Landlords only.</p>
      </div>
    );
  }

  const currentPlanName = currentSub?.planName?.toLowerCase();

  const handleSubscribe = async (planId: number, planName: string) => {
    setSubscribing(planId);
    try {
      await api.post(`/Subscription/${planId}`, {});
      toast.success(`Subscribed to ${planName} plan successfully!`);
      // Refresh current subscription
      const data = await api.get<SubscriptionDto>('/Subscription');
      setCurrentSub(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to subscribe.');
    } finally {
      setSubscribing(null);
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await api.put('/Subscription', {});
      toast.success('Subscription renewed successfully!');
      const data = await api.get<SubscriptionDto>('/Subscription');
      setCurrentSub(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to renew subscription.');
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-[#717182] hover:text-[#34495E]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[#34495E] mb-3">Choose Your Plan</h1>
          <p className="text-[#717182] max-w-xl mx-auto">
            Upgrade your plan to list more properties and reach more students.
          </p>
        </div>

        {/* Current plan badge */}
        {!loading && currentSub && (
          <div className="mb-8 p-4 bg-[#00A5A7]/10 border border-[#00A5A7]/30 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-[#34495E] font-medium">
                Current Plan: <span className="text-[#00A5A7]">{currentSub.planName}</span>
              </p>
              <p className="text-[#717182] text-sm mt-0.5">
                Max listings: {currentSub.maxListings.toLocaleString()}
              </p>
            </div>
            {currentPlanName !== 'freemium' && (
              <Button
                onClick={handleRenew}
                disabled={renewing}
                variant="outline"
                className="border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white"
              >
                {renewing ? 'Renewing...' : 'Renew Plan'}
              </Button>
            )}
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanName === plan.name.toLowerCase();
            const isLoading = subscribing === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
                  plan.popular ? 'border-[#00A5A7] border-2' : ''
                } ${isCurrent ? 'ring-2 ring-[#B8E986]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-[#00A5A7] text-white text-center text-xs py-1 font-medium">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-[#B8E986] text-[#34495E] text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Current
                  </div>
                )}

                <CardHeader className={`${plan.popular ? 'pt-8' : 'pt-6'} pb-4`}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                  >
                    {plan.icon}
                  </div>
                  <CardTitle className="text-[#34495E]">{plan.name}</CardTitle>
                  <p className="text-[#717182] text-sm">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div>
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-[#34495E]">Free</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#34495E]">
                          EGP {plan.price.toLocaleString()}
                        </span>
                        {plan.durationInDays && (
                          <span className="text-[#717182] text-sm">
                            / {plan.durationInDays} days
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Max listings badge */}
                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-white border-0"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.maxListings >= 1000
                        ? `${plan.maxListings.toLocaleString()} listings`
                        : `Up to ${plan.maxListings} listings`}
                    </Badge>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#717182]">
                        <Check className="w-4 h-4 text-[#B8E986] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className="w-full text-white border-0"
                    style={{
                      backgroundColor: isCurrent ? '#B8E986' : plan.color,
                      color: isCurrent ? '#34495E' : 'white',
                    }}
                    disabled={isCurrent || isLoading || plan.price === 0}
                    onClick={() => !isCurrent && plan.price > 0 && handleSubscribe(plan.id, plan.name)}
                  >
                    {isLoading
                      ? 'Processing...'
                      : isCurrent
                      ? 'Current Plan'
                      : plan.price === 0
                      ? 'Default Plan'
                      : `Subscribe — EGP ${plan.price.toLocaleString()}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
