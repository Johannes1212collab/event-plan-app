const fs = require('fs');

const code = fs.readFileSync('src/components/dashboard/event-scanner.tsx', 'utf8');
const regex = /    const handleGeolocate = async \(\) => \{[\s\S]*?    const handleScan = async \(\) => \{/m;

const newCode = `    const handleGeolocate = async () => {
        setIsLocating(true);
        toast.dismiss();

        const resolveAddress = async (lat: number, lng: number, fallbackCity = "My Location") => {
            try {
                const res = await fetch(\`https://maps.googleapis.com/maps/api/geocode/json?latlng=\${lat},\${lng}&key=\${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}\`, { signal: AbortSignal.timeout(4000) });
                const data = await res.json();
                let foundAddress = fallbackCity;
                if (data.results && data.results.length > 0) {
                    const localityObj = data.results.find((r: any) => r.types.includes("locality"));
                    if (localityObj) {
                        foundAddress = localityObj.formatted_address;
                    } else {
                        foundAddress = data.results[0].formatted_address;
                    }
                }
                setAddress(foundAddress);
                setSelectedLat(lat);
                setSelectedLng(lng);
                setRadius(5);
            } catch (error) {
                console.error("Geocoding failed", error);
                setAddress(fallbackCity);
                setSelectedLat(lat);
                setSelectedLng(lng);
                setRadius(5);
            }
        };

        const tryIpFallback = async () => {
            try {
                const ipRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData.latitude && ipData.longitude) {
                        await resolveAddress(ipData.latitude, ipData.longitude, \`\${ipData.city || 'Your Area'} (Approximate)\`);
                        return true;
                    }
                }
            } catch (err) {
                console.error("IP Fallback Failed", err);
            }
            return false;
        };

        const getDeviceLocation = () => {
            return new Promise<GeolocationPosition>((resolve, reject) => {
                if (!("geolocation" in navigator)) {
                    reject(new Error("No Geolocation Support"));
                    return;
                }
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 4000, 
                    maximumAge: 60000
                });
            });
        };

        try {
            const position = await getDeviceLocation();
            await resolveAddress(position.coords.latitude, position.coords.longitude);
        } catch (deviceError) {
            console.warn("Device location rejected/timed out. Attempting IP fallback.", deviceError);
            const ipSuccess = await tryIpFallback();
            
            if (!ipSuccess) {
                toast.error("Could not determine your location. Please type a city manually.");
            }
        } finally {
            setIsLocating(false);
        }
    };

    const handleScan = async () => {`;

const updatedFile = code.replace(regex, newCode);

if (updatedFile !== code) {
    fs.writeFileSync('src/components/dashboard/event-scanner.tsx', updatedFile);
    console.log('REPLACED SUCCESSFULLY');
} else {
    console.log('NOT FOUND');
}
