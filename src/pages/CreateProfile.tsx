import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

const SECTORS = [
  'Technology', 'Entertainment', 'Food & Dining', 'Fashion', 'Education',
  'Sports', 'Healthcare', 'Finance', 'Travel', 'Real Estate', 'Other'
];

const SOCIAL_PLATFORMS = [
  'Instagram', 'Facebook', 'Twitter', 'YouTube', 'LinkedIn', 'TikTok'
];

interface SocialLink {
  platform: string;
  url: string;
}

export default function CreateProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [customSector, setCustomSector] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [caption, setCaption] = useState('Follow and Rate Us on RateHere!');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be signed in to create a profile');
      return;
    }

    if (!name || !sector || !logoFile) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Upload logo to Cloudinary
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('upload_preset', 'ratehere');
      
      const cloudinaryResponse = await fetch(
        'https://api.cloudinary.com/v1_1/djlrarljg/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const cloudinaryData = await cloudinaryResponse.json();
      const logoUrl = cloudinaryData.secure_url;

      // Create profile document in Firestore
      const finalSector = sector === 'Other' ? customSector : sector;
      const validSocialLinks = socialLinks.filter(link => link.platform && link.url);

      await addDoc(collection(db, 'profiles'), {
        name,
        sector: finalSector,
        description,
        logoUrl,
        socialLinks: validSocialLinks,
        caption,
        createdBy: user.uid,
        createdAt: new Date(),
        rating: 0,
        ratingCount: 0,
        totalRatingValue: 0,
      });

      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-12">
        <div className="space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Create Your Profile</h1>
            <p className="text-lg text-muted-foreground">
              Share your story and let the community rate you
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about yourself or your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Profile Logo/Image *</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name or business name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Business Sector *</Label>
                  <Select value={sector} onValueChange={setSector} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {sector === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customSector">Custom Sector</Label>
                    <Input
                      id="customSector"
                      value={customSector}
                      onChange={(e) => setCustomSector(e.target.value)}
                      placeholder="Enter your custom sector"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell people about yourself..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Add your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="caption">Social Links Caption</Label>
                  <Input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Follow and Rate Us on RateHere!"
                  />
                </div>

                {socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={link.platform}
                      onValueChange={(value) => updateSocialLink(index, 'platform', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSocialLink}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Social Link
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
