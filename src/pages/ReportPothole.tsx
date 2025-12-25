import { useState, useRef, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  User,
  Navigation as NavIcon,
  X,
  Sparkles,
  Send
} from "lucide-react";
import { uploadPotholeReport } from "@/lib/dynamodb";
import { latLngToCell } from "h3-js";

// ============================================
// Animation keyframes (add to your global CSS or use inline)
// ============================================
const pulseAnimation = "animate-pulse";
const bounceAnimation = "animate-bounce";

// ============================================
// Report Pothole Page
// ============================================
const ReportPothole = () => {
  // Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hexId, setHexId] = useState<string>("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Image State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  // Get user's location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        
        // Convert to H3 hex ID (resolution 9 is good for street-level)
        try {
          const h3Index = latLngToCell(lat, lng, 9);
          setHexId(h3Index);
        } catch (err) {
          console.error("Failed to convert to H3:", err);
          setHexId(`${lat.toFixed(6)}_${lng.toFixed(6)}`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadError("Image must be less than 10MB");
        return;
      }
      
      setSelectedImage(file);
      setUploadError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit report
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setUploadError("Please enter your name");
      return;
    }
    
    if (!location || !hexId) {
      setUploadError("Please enable location to report a pothole");
      return;
    }
    
    if (!selectedImage) {
      setUploadError("Please select an image of the pothole");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const result = await uploadPotholeReport(selectedImage, hexId, name.trim());
      
      if (result.success) {
        setUploadSuccess(true);
        setUploadedKey(result.key || null);
        
        // Reset form after success
        setTimeout(() => {
          setName("");
          setSelectedImage(null);
          setImagePreview(null);
          setLocation(null);
          setHexId("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }, 3000);
      } else {
        setUploadError(result.error || "Failed to upload report");
      }
    } catch (err: any) {
      setUploadError(err.message || "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  // Check if form is valid
  const isFormValid = name.trim() && location && hexId && selectedImage;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 animate-bounce">
            <AlertTriangle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Report a Pothole
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us improve road conditions in your area. Your reports make a difference!
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="glass-card shadow-card overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            {/* Success State */}
            {uploadSuccess && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                  <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10 animate-in zoom-in duration-500" />
                </div>
                <h3 className="text-2xl font-bold mt-6 mb-2">Thank You!</h3>
                <p className="text-muted-foreground text-center max-w-xs">
                  Your pothole report has been submitted successfully.
                </p>
                <div className="mt-4 text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1 rounded">
                  {uploadedKey}
                </div>
                <Sparkles className="w-6 h-6 text-yellow-500 mt-4 animate-pulse" />
              </div>
            )}

            {/* Step 1: Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                Your Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg transition-all focus:ring-2 focus:ring-primary/20"
                disabled={isUploading}
              />
            </div>

            {/* Step 2: Location */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </Label>
              
              {!location ? (
                <Button
                  variant="outline"
                  className="w-full h-14 text-base border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={getLocation}
                  disabled={isGettingLocation || isUploading}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Getting your location...
                    </>
                  ) : (
                    <>
                      <NavIcon className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
                      Enable Location
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Location Captured</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-background/50 rounded px-2 py-1">
                      <span className="text-muted-foreground">Lat: </span>
                      <span className="font-mono">{location.lat.toFixed(6)}</span>
                    </div>
                    <div className="bg-background/50 rounded px-2 py-1">
                      <span className="text-muted-foreground">Lng: </span>
                      <span className="font-mono">{location.lng.toFixed(6)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono bg-background/30 px-2 py-1 rounded truncate">
                    Hex: {hexId}
                  </div>
                </div>
              )}
              
              {locationError && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg animate-in shake">
                  <AlertTriangle className="w-4 h-4" />
                  {locationError}
                </div>
              )}
            </div>

            {/* Step 3: Image Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Camera className="w-4 h-4 text-primary" />
                Pothole Photo
              </Label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isUploading}
              />
              {/* Note: capture="environment" forces camera on mobile. Desktop will show file picker as fallback. */}
              
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                    Tap to take a photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Camera will open to capture pothole
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden animate-in zoom-in duration-300">
                  <img
                    src={imagePreview}
                    alt="Pothole preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                    onClick={removeImage}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm truncate">{selectedImage?.name}</p>
                    <p className="text-white/70 text-xs">
                      {((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-lg animate-in slide-in-from-bottom duration-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-14 text-lg font-semibold gradient-primary shadow-glow group relative overflow-hidden disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!isFormValid || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Submit Report
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </>
              )}
            </Button>

            {/* Form Progress Indicator */}
            <div className="flex justify-center gap-2 pt-2">
              <div className={`w-3 h-3 rounded-full transition-all ${name.trim() ? 'bg-green-500 scale-110' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full transition-all ${location ? 'bg-green-500 scale-110' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full transition-all ${selectedImage ? 'bg-green-500 scale-110' : 'bg-muted'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <div className="mt-8 text-center text-sm text-muted-foreground space-y-2">
          <p>📸 <strong>Tip:</strong> Take a clear photo during daylight for best results</p>
          <p>📍 Stand near the pothole when enabling location for accuracy</p>
        </div>
      </div>
    </div>
  );
};

export default ReportPothole;
