import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Crosshair, Loader2, Check, RefreshCw } from 'lucide-react';

// Saffron Pin Icon for Leaflet
const createPinIcon = () => {
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 7px; border-radius: 9999px; box-shadow: 0 10px 20px -3px rgba(234, 88, 12, 0.5); border: 2.5px solid white; display: flex; align-items: center; justify-content: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
                <div style="width: 4px; height: 6px; background-color: #c2410c; margin-top: -1px; border-bottom-left-radius: 2px; border-bottom-right-radius: 2px;"></div>
                <div style="width: 14px; height: 4px; background-color: rgba(0,0,0,0.25); border-radius: 9999px; margin-top: 1px; filter: blur(1px);"></div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
};

export default function LocationPicker({
    initialLat,
    initialLng,
    onLocationSelect,
    className = '',
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // Default coordinates: Default to provided lat/lng or default center
    const parsedInitialLat = initialLat ? parseFloat(initialLat) : 28.6139;
    const parsedInitialLng = initialLng ? parseFloat(initialLng) : 77.2090;

    const [currentCoords, setCurrentCoords] = useState({
        lat: initialLat ? parseFloat(initialLat) : null,
        lng: initialLng ? parseFloat(initialLng) : null,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState(null);
    const [geoError, setGeoError] = useState(null);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup existing instance if any
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        const initialCenter = [
            currentCoords.lat || parsedInitialLat,
            currentCoords.lng || parsedInitialLng,
        ];
        const initialZoom = currentCoords.lat && currentCoords.lng ? 15 : 6;

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: initialZoom,
            zoomControl: false,
        });

        // Add OSM Standard tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }).addTo(map);

        // Add custom positioned zoom controls
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Create marker if coordinates exist
        const customPin = createPinIcon();
        const marker = L.marker(initialCenter, {
            icon: customPin,
            draggable: true,
        }).addTo(map);

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Invalidate size shortly to fix modal animation layout issues
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);

        // Listen for marker drag events
        marker.on('dragend', (e) => {
            const position = e.target.getLatLng();
            handlePositionChange(position.lat, position.lng, true);
        });

        // Listen for map clicks to place marker
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            handlePositionChange(lat, lng, true);
        });

        // If initial coordinates exist, reverse geocode once
        if (currentCoords.lat && currentCoords.lng) {
            reverseGeocode(currentCoords.lat, currentCoords.lng);
        }

        return () => {
            clearTimeout(timer);
            map.remove();
        };
    }, []);

    // Handle position change and reverse geocode
    const handlePositionChange = (lat, lng, fetchAddress = true) => {
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));

        setCurrentCoords({ lat: roundedLat, lng: roundedLng });
        setGeoError(null);

        if (markerRef.current) {
            markerRef.current.setLatLng([roundedLat, roundedLng]);
        }

        if (fetchAddress) {
            reverseGeocode(roundedLat, roundedLng);
        }
    };

    // Free OpenStreetMap Reverse Geocoding (Nominatim API)
    const reverseGeocode = async (lat, lng) => {
        setIsGeocoding(true);
        setGeoError(null);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (!res.ok) {
                throw new Error('Could not fetch address details');
            }

            const data = await res.json();
            const address = data.address || {};

            // Extract relevant address components
            const streetNumber = address.house_number || '';
            const road = address.road || address.pedestrian || address.neighbourhood || address.suburb || '';
            const line1 = [streetNumber, road].filter(Boolean).join(' ') || data.name || '';
            const line2 = address.suburb || address.city_district || address.neighbourhood || '';
            const city = address.city || address.town || address.village || address.municipality || address.county || '';
            const state = address.state || address.region || address.state_district || '';
            const postalCode = address.postcode || '';
            const country = address.country || '';

            const result = {
                latitude: String(lat),
                longitude: String(lng),
                address_line_1: line1,
                address_line_2: line2 !== line1 ? line2 : '',
                city: city,
                state: state,
                postal_code: postalCode,
                country: country,
                formatted_address: data.display_name || '',
            };

            setDetectedAddress(result);

            if (onLocationSelect) {
                onLocationSelect(result);
            }
        } catch (err) {
            console.error('Reverse Geocode error:', err);
            const fallbackResult = {
                latitude: String(lat),
                longitude: String(lng),
            };
            if (onLocationSelect) {
                onLocationSelect(fallbackResult);
            }
        } finally {
            setIsGeocoding(false);
        }
    };

    // Free OpenStreetMap Forward Geocoding Search (Nominatim API)
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setGeoError(null);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&addressdetails=1&limit=5`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (!res.ok) {
                throw new Error('Location search request failed');
            }

            const data = await res.json();
            setSearchResults(data);
            setShowResultsDropdown(true);

            if (data.length === 0) {
                setGeoError('No location matches found. Try searching with a different landmark or city.');
            }
        } catch (err) {
            console.error('Search error:', err);
            setGeoError('Failed to search location. Please check your network.');
        } finally {
            setIsSearching(false);
        }
    };

    // When user selects an autocomplete search result
    const handleSelectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setShowResultsDropdown(false);
        setSearchQuery(result.display_name.split(',')[0]);

        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }

        handlePositionChange(lat, lng, false);

        const address = result.address || {};
        const streetNumber = address.house_number || '';
        const road = address.road || address.pedestrian || address.neighbourhood || address.suburb || '';
        const line1 = [streetNumber, road].filter(Boolean).join(' ') || result.name || '';
        const line2 = address.suburb || address.city_district || address.neighbourhood || '';
        const city = address.city || address.town || address.village || address.municipality || address.county || '';
        const state = address.state || address.region || address.state_district || '';
        const postalCode = address.postcode || '';
        const country = address.country || '';

        const locationData = {
            latitude: String(lat),
            longitude: String(lng),
            address_line_1: line1,
            address_line_2: line2 !== line1 ? line2 : '',
            city: city,
            state: state,
            postal_code: postalCode,
            country: country,
            formatted_address: result.display_name,
        };

        setDetectedAddress(locationData);

        if (onLocationSelect) {
            onLocationSelect(locationData);
        }
    };

    // User Clicks "Use My Current Location" via Browser Geolocation API
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }

        setIsLocating(true);
        setGeoError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                const { latitude, longitude } = position.coords;

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
                }

                handlePositionChange(latitude, longitude, true);
            },
            (err) => {
                setIsLocating(false);
                let message = 'Unable to retrieve your location.';
                if (err.code === 1) {
                    message = 'Location access was denied. Please enable location permissions in your browser.';
                } else if (err.code === 2) {
                    message = 'Location information is currently unavailable.';
                } else if (err.code === 3) {
                    message = 'Location request timed out. Please try again.';
                }
                setGeoError(message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Search and Current Location Action Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Search Input Bar */}
                <div className="relative flex-1">
                    <form onSubmit={handleSearch} className="flex items-center">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (!e.target.value.trim()) setShowResultsDropdown(false);
                                }}
                                onFocus={() => {
                                    if (searchResults.length > 0) setShowResultsDropdown(true);
                                }}
                                placeholder="Search area, landmark, street or city..."
                                className="w-full pl-9 pr-20 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                            />
                            <button
                                type="submit"
                                disabled={isSearching || !searchQuery.trim()}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                            >
                                {isSearching ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <span>Search</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Autocomplete Results Dropdown */}
                    {showResultsDropdown && searchResults.length > 0 && (
                        <div className="absolute z-[1000] left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                            {searchResults.map((item) => (
                                <button
                                    key={item.place_id}
                                    type="button"
                                    onClick={() => handleSelectSearchResult(item)}
                                    className="w-full text-left p-2.5 hover:bg-amber-50/80 transition flex items-start space-x-2.5 text-xs text-gray-700 cursor-pointer"
                                >
                                    <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-xs">
                                            {item.display_name.split(',')[0]}
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-1">
                                            {item.display_name}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detect GPS Current Location Button */}
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-amber-300 disabled:to-orange-300 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Detect your device GPS coordinates automatically"
                >
                    {isLocating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Locating GPS...</span>
                        </>
                    ) : (
                        <>
                            <Crosshair className="w-4 h-4" />
                            <span>Use Current Location</span>
                        </>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {geoError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
                    <span>{geoError}</span>
                    <button type="button" onClick={() => setGeoError(null)} className="font-bold ml-2">✕</button>
                </div>
            )}

            {/* Map Canvas Container */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-200/80 shadow-inner bg-amber-50/20">
                <div
                    ref={mapContainerRef}
                    className="w-full h-64 sm:h-72 z-0"
                    style={{ minHeight: '250px' }}
                />

                {/* Floating Map Helper Badge */}
                <div className="absolute top-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-amber-100 text-[11px] font-semibold text-amber-900 flex items-center space-x-1.5 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Click map or drag the pin</span>
                </div>

                {/* Loading reverse geocoding overlay spinner */}
                {isGeocoding && (
                    <div className="absolute bottom-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md border border-amber-200 text-[11px] font-bold text-amber-700 flex items-center space-x-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>Detecting address details...</span>
                    </div>
                )}
            </div>

            {/* Selected Coordinates & Address Preview Card */}
            {currentCoords.lat && currentCoords.lng ? (
                <div className="p-3 bg-gradient-to-r from-amber-50/90 to-orange-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 flex-1">
                        <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs">
                                <Check className="w-3 h-3 mr-1" /> GPS PIN ACTIVE
                            </span>
                            <span className="font-mono text-[11px] font-bold text-amber-950">
                                Lat: {currentCoords.lat.toFixed(5)}, Lng: {currentCoords.lng.toFixed(5)}
                            </span>
                        </div>
                        {detectedAddress?.formatted_address && (
                            <p className="text-[11px] text-gray-700 line-clamp-1 pt-0.5">
                                <span className="font-semibold text-amber-900">Detected: </span>
                                {detectedAddress.formatted_address}
                            </p>
                        )}
                    </div>
                    <div className="text-[10px] text-amber-800 font-bold bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200/60">
                        Address auto-filled below ✓
                    </div>
                </div>
            ) : (
                <div className="p-2.5 bg-amber-50/40 border border-dashed border-amber-300 rounded-xl text-center text-xs text-amber-800">
                    Click the map or tap <strong>"Use Current Location"</strong> to set precise delivery GPS coordinates.
                </div>
            )}
        </div>
    );
}
