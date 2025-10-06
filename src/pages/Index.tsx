import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import ProfileCard from '@/components/ProfileCard';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Users, Award } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  sector: string;
  logoUrl: string;
  rating: number;
  ratingCount: number;
}

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topProfiles, setTopProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProfiles = async () => {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, orderBy('rating', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        
        const profiles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Profile));
        
        setTopProfiles(profiles);
      } catch (error) {
        console.error('Error fetching top profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light/20 border border-primary/10">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-medium text-primary">The Ultimate Rating Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Rate Anything.
              <br />
              <span className="text-primary">Discover Everything.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create your profile, showcase your social links, and let the world rate you. 
              Join the community where reputation matters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 shadow-premium"
                onClick={() => navigate(user ? '/create-profile' : '/auth')}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
                onClick={() => navigate('/leaderboard')}
              >
                View Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">10K+</h3>
              <p className="text-muted-foreground">Active Profiles</p>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">500K+</h3>
              <p className="text-muted-foreground">Ratings Given</p>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">50+</h3>
              <p className="text-muted-foreground">Industry Sectors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Profiles Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Top Rated</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">Featured Profiles</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the highest-rated profiles on RateHere
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : topProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topProfiles.map(profile => (
                <ProfileCard key={profile.id} {...profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground">No profiles yet. Be the first to create one!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/leaderboard')}
            >
              View All Profiles
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Build Your Reputation?
          </h2>
          <p className="text-xl text-primary-foreground/90">
            Create your profile in minutes and start collecting ratings from your community.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate(user ? '/create-profile' : '/auth')}
          >
            Create Your Profile
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p className="text-sm">© 2025 RateHere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
