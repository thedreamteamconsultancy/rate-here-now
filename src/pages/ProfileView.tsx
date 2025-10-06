import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import StarRating from '@/components/StarRating';
import SocialLinks from '@/components/SocialLinks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  sector: string;
  description: string;
  logoUrl: string;
  socialLinks: Array<{ platform: string; url: string }>;
  caption: string;
  rating: number;
  ratingCount: number;
}

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        const profileDoc = await getDoc(doc(db, 'profiles', id));
        
        if (profileDoc.exists()) {
          setProfile({ id: profileDoc.id, ...profileDoc.data() } as Profile);
          
          // Check if user has already rated this profile
          if (user) {
            const ratingsRef = collection(db, 'ratings');
            const q = query(
              ratingsRef,
              where('profileId', '==', id),
              where('userId', '==', user.uid)
            );
            const ratingSnapshot = await getDocs(q);
            
            if (!ratingSnapshot.empty) {
              setUserRating(ratingSnapshot.docs[0].data().ratingValue);
              setHasRated(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);

  const handleRating = async (rating: number) => {
    if (!user) {
      toast.error('Please sign in to rate this profile');
      return;
    }

    if (!id) return;

    try {
      if (hasRated) {
        toast.error('You have already rated this profile');
        return;
      }

      // Add rating to ratings collection
      await addDoc(collection(db, 'ratings'), {
        profileId: id,
        userId: user.uid,
        ratingValue: rating,
        createdAt: new Date(),
      });

      // Update profile rating
      const profileRef = doc(db, 'profiles', id);
      const newRatingCount = (profile?.ratingCount || 0) + 1;
      const newTotalRating = (profile?.rating || 0) * (profile?.ratingCount || 0) + rating;
      const newAverage = newTotalRating / newRatingCount;

      await updateDoc(profileRef, {
        rating: newAverage,
        ratingCount: increment(1),
      });

      setUserRating(rating);
      setHasRated(true);
      setProfile(prev => prev ? {
        ...prev,
        rating: newAverage,
        ratingCount: newRatingCount
      } : null);

      toast.success('Thank you for rating!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 pt-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Profile not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-12">
        <div className="space-y-8 animate-fade-in">
          <Card className="overflow-hidden shadow-premium">
            <div className="h-48 gradient-hero" />
            <CardContent className="relative pt-0 pb-8">
              <div className="flex flex-col items-center -mt-20 space-y-6">
                <div className="w-40 h-40 rounded-2xl overflow-hidden bg-card shadow-premium border-4 border-background">
                  <img
                    src={profile.logoUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center space-y-2">
                  <h1 className="text-4xl font-bold text-foreground">{profile.name}</h1>
                  <Badge variant="secondary" className="text-sm">
                    {profile.sector}
                  </Badge>
                </div>

                {profile.description && (
                  <p className="text-center text-muted-foreground max-w-2xl">
                    {profile.description}
                  </p>
                )}

                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex items-center gap-3">
                    <StarRating rating={profile.rating} size={32} showValue />
                    <span className="text-sm text-muted-foreground">
                      ({profile.ratingCount} {profile.ratingCount === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          {profile.socialLinks.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <SocialLinks links={profile.socialLinks} caption={profile.caption} />
              </CardContent>
            </Card>
          )}

          {/* Rating Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {hasRated ? 'Your Rating' : 'Rate This Profile'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasRated
                    ? 'Thank you for rating this profile!'
                    : user
                    ? 'Click on the stars to rate'
                    : 'Sign in to rate this profile'}
                </p>
                <div className="flex justify-center">
                  <StarRating
                    rating={userRating}
                    interactive={!hasRated && !!user}
                    onRatingChange={handleRating}
                    size={40}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
