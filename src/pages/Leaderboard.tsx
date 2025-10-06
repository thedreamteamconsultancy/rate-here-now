import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import ProfileCard from '@/components/ProfileCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  sector: string;
  logoUrl: string;
  rating: number;
  ratingCount: number;
}

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, orderBy('rating', 'desc'));
        const snapshot = await getDocs(q);
        
        const profilesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Profile));
        
        setProfiles(profilesData);
        setFilteredProfiles(profilesData);
        
        // Extract unique sectors
        const uniqueSectors = Array.from(new Set(profilesData.map(p => p.sector)));
        setSectors(uniqueSectors);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedSector === 'all') {
      setFilteredProfiles(profiles);
    } else {
      setFilteredProfiles(profiles.filter(p => p.sector === selectedSector));
    }
  }, [selectedSector, profiles]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-12">
        <div className="space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-accent">Leaderboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Top Rated Profiles</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the highest-rated profiles across all sectors
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile, index) => (
                <div key={profile.id} className="relative">
                  {index < 3 && (
                    <div className="absolute -top-3 -left-3 z-10 w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold shadow-premium">
                      #{index + 1}
                    </div>
                  )}
                  <ProfileCard {...profile} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground">
                {selectedSector === 'all'
                  ? 'No profiles yet. Be the first to create one!'
                  : `No profiles found in ${selectedSector} sector`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
