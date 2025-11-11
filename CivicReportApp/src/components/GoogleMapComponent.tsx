import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    description: string;
    category: string;
    onClick: () => void;
  }>;
  style: any;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({ 
  center, 
  zoom, 
  markers, 
  style 
}) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'infrastructure': return 'red';
      case 'safety': return 'orange';
      case 'environment': return 'green';
      case 'transport': return 'blue';
      default: return 'purple';
    }
  };

  const generateMapHTML = () => {
    const markersJS = markers.map((marker, index) => `
      var marker${index} = new google.maps.Marker({
        position: { lat: ${marker.position.lat}, lng: ${marker.position.lng} },
        map: map,
        title: "${marker.title}",
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="${getMarkerColor(marker.category)}" stroke="white" stroke-width="2"/>
            </svg>
          `)}',
          scaledSize: new google.maps.Size(20, 20)
        }
      });
      
      var infoWindow${index} = new google.maps.InfoWindow({
        content: '<div><h3>${marker.title}</h3><p>${marker.description}</p></div>'
      });
      
      marker${index}.addListener('click', function() {
        infoWindow${index}.open(map, marker${index});
      });
    `).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body, html, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function initMap() {
            var map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${center.lat}, lng: ${center.lng} },
              zoom: ${zoom}
            });
            
            ${markersJS}
            
            // Add user location if available
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                var userLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                
                var userMarker = new google.maps.Marker({
                  position: userLocation,
                  map: map,
                  title: 'Your Location',
                  icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="6" fill="#007AFF" stroke="white" stroke-width="2"/>
                      </svg>
                    `)}',
                    scaledSize: new google.maps.Size(16, 16)
                  }
                });
              });
            }
          }
        </script>
        <script async defer 
          src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap">
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={style}>
      <WebView
        source={{ html: generateMapHTML() }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
      />
    </View>
  );
};

export default GoogleMapComponent;
