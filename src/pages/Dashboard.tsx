import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import ProfileCard from '@/components/ProfileCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  name: string;
  sector: string;
  logoUrl: string;
  rating: number;
  ratingCount: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserProfiles = async () => {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('createdBy', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const profilesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Profile));
        
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
        toast.error('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfiles();
  }, [user, navigate]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const profile = profiles.find(p => p.id === deleteId);
      if (!profile) return;

      // Delete logo from storage
      try {
        const logoRef = ref(storage, profile.logoUrl);
        await deleteObject(logoRef);
      } catch (error) {
        console.warn('Error deleting logo:', error);
      }

      // Delete all ratings for this profile
      const ratingsRef = collection(db, 'ratings');
      const ratingsQuery = query(ratingsRef, where('profileId', '==', deleteId));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      
      const deletePromises = ratingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete profile
      await deleteDoc(doc(db, 'profiles', deleteId));

      setProfiles(profiles.filter(p => p.id !== deleteId));
      toast.success('Profile deleted successfully');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto max-w-7xl px-4 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-12">
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Profiles</h1>
              <p className="text-muted-foreground mt-2">
                Manage your profiles and track their performance
              </p>
            </div>
            <Button onClick={() => navigate('/create-profile')} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Profile
            </Button>
          </div>

          {profiles.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">No profiles yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Create your first profile to start building your reputation on RateHere
                    </p>
                  </div>
                  <Button onClick={() => navigate('/create-profile')} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <div key={profile.id} className="relative group">
                  <ProfileCard {...profile} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-background/95 backdrop-blur hover:bg-primary hover:text-primary-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/edit-profile/${profile.id}`);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteId(profile.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This action cannot be undone.
              All ratings for this profile will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
