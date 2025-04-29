const axios = require('axios');
const logger = require('./Logger');

// This utility file handles interactions with Google Maps API

/**
 * Get directions between two points
 * @param {Array} origin - [latitude, longitude] of starting point
 * @param {Array} destination - [latitude, longitude] of ending point
 * @param {Array} waypoints - Array of [latitude, longitude] for waypoints
 * @returns {Object} Route information including distance, duration, and path
 */
exports.getDirections = async (origin, destination, waypoints = []) => {
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      logger.error('Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    // Format origin, destination and waypoints
    const originStr = `${origin[0]},${origin[1]}`;
    const destinationStr = `${destination[0]},${destination[1]}`;
    
    // Format waypoints if any
    let waypointsStr = '';
    if (waypoints.length > 0) {
      waypointsStr = '&waypoints=' + waypoints.map(point => `${point[0]},${point[1]}`).join('|');
    }

    // Make request to Google Maps Directions API
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}${waypointsStr}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status !== 'OK') {
      logger.error(`Google Maps API error: ${response.data.status}`);
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    // Extract relevant information from response
    const route = response.data.routes[0];
    const leg = route.legs[0];
    
    // Extract polyline (path) information
    const path = route.overview_polyline.points;
    
    return {
      distance: leg.distance.value, // in meters
      duration: leg.duration.value, // in seconds
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      path,
      steps: leg.steps.map(step => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instructions: step.html_instructions,
        startLocation: [step.start_location.lat, step.start_location.lng],
        endLocation: [step.end_location.lat, step.end_location.lng]
      }))
    };
  } catch (error) {
    logger.error(`Error getting directions: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate optimal checkpoints along a route
 * @param {Array} path - Array of coordinates representing the route
 * @param {Number} numCheckpoints - Number of checkpoints to create
 * @returns {Array} Array of checkpoint locations
 */
exports.calculateCheckpoints = (path, numCheckpoints) => {
  // If path is empty or only has start/end, return empty array
  if (!path || path.length <= 2) {
    return [];
  }
  
  // Calculate total distance of path
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += calculateDistance(path[i-1], path[i]);
  }
  
  // Calculate distance between checkpoints
  const checkpointDistance = totalDistance / (numCheckpoints + 1);
  
  // Place checkpoints at regular intervals
  const checkpoints = [];
  let currentDistance = 0;
  let nextCheckpoint = checkpointDistance;
  
  for (let i = 1; i < path.length; i++) {
    const segmentDistance = calculateDistance(path[i-1], path[i]);
    currentDistance += segmentDistance;
    
    // If we've passed the next checkpoint distance
    while (currentDistance >= nextCheckpoint && checkpoints.length < numCheckpoints) {
      // Calculate position along current segment
      const ratio = 1 - (currentDistance - nextCheckpoint) / segmentDistance;
      const checkpointLocation = [
        path[i][0] * ratio + path[i-1][0] * (1 - ratio),
        path[i][1] * ratio + path[i-1][1] * (1 - ratio)
      ];
      
      checkpoints.push({
        location: {
          type: "Point",
          coordinates: checkpointLocation
        },
        name: `Checkpoint ${checkpoints.length + 1}`
      });
      
      nextCheckpoint += checkpointDistance;
    }
  }
  
  return checkpoints;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Array} point1 - [latitude, longitude]
 * @param {Array} point2 - [latitude, longitude]
 * @returns {Number} Distance in kilometers
 */
function calculateDistance(point1, point2) {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {Number} deg - Degrees
 * @returns {Number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Check if a point is within a certain distance of a route
 * @param {Array} point - [latitude, longitude] to check
 * @param {Array} route - Array of [latitude, longitude] points defining the route
 * @param {Number} maxDistance - Maximum distance in kilometers
 * @returns {Boolean} True if point is within maxDistance of route
 */
exports.isPointNearRoute = (point, route, maxDistance) => {
  if (!route || route.length === 0) return false;
  
  // Find minimum distance to any segment of the route
  let minDistance = Infinity;
  
  for (let i = 1; i < route.length; i++) {
    const segmentDistance = distanceToSegment(point, route[i-1], route[i]);
    minDistance = Math.min(minDistance, segmentDistance);
  }
  
  return minDistance <= maxDistance;
};

/**
 * Calculate distance from a point to a line segment
 * @param {Array} point - [latitude, longitude]
 * @param {Array} lineStart - [latitude, longitude] of segment start
 * @param {Array} lineEnd - [latitude, longitude] of segment end
 * @returns {Number} Distance in kilometers
 */
function distanceToSegment(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  
  if (len_sq !== 0) {
    param = dot / len_sq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x - xx;
  const dy = y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate a QR code for delivery verification
 * @param {String} deliveryId - ID of the delivery
 * @param {String} otp - One-time password for verification
 * @returns {String} URL to QR code image
 */
exports.generateQRCode = (deliveryId, otp) => {
  // This would typically call a QR code generation service or library
  // For now, we'll just return a URL to a Google Charts QR code
  const data = `DELIVERY:${deliveryId}|OTP:${otp}`;
  const encodedData = encodeURIComponent(data);
  return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodedData}`;
};

/**
 * Get geocode information for an address
 * @param {String} address - Address to geocode
 * @returns {Object} Geocode information including coordinates
 */
exports.geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      logger.error('Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }
    
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status !== 'OK') {
      logger.error(`Geocoding error: ${response.data.status}`);
      throw new Error(`Geocoding error: ${response.data.status}`);
    }
    
    const result = response.data.results[0];
    
    return {
      formattedAddress: result.formatted_address,
      coordinates: [
        result.geometry.location.lat,
        result.geometry.location.lng
      ],
      placeId: result.place_id
    };
  } catch (error) {
    logger.error(`Error geocoding address: ${error.message}`);
    throw error;
  }
};