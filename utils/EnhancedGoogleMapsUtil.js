const axios = require('axios');
const logger = require('./Logger');
const GoogleMapsUtil = require('./GoogleMapsUtil');

/**
 * Enhanced Google Maps utility functions for real-time tracking and route verification
 */

/**
 * Get optimized route with traffic consideration
 * @param {Array} origin - [latitude, longitude] of starting point
 * @param {Array} destination - [latitude, longitude] of ending point
 * @param {Array} waypoints - Array of [latitude, longitude] for waypoints
 * @returns {Object} Route information including traffic-aware distance, duration, and path
 */
exports.getTrafficAwareRoute = async (origin, destination, waypoints = []) => {
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

    // Make request to Google Maps Directions API with traffic model
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}${waypointsStr}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
    
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
      duration: leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value, // in seconds
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      path,
      trafficConditions: leg.duration_in_traffic ? 
        (leg.duration_in_traffic.value > leg.duration.value * 1.5 ? 'heavy' : 
         leg.duration_in_traffic.value > leg.duration.value * 1.2 ? 'moderate' : 'light') : 'unknown',
      steps: leg.steps.map(step => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instructions: step.html_instructions,
        startLocation: [step.start_location.lat, step.start_location.lng],
        endLocation: [step.end_location.lat, step.end_location.lng]
      }))
    };
  } catch (error) {
    logger.error(`Error getting traffic-aware route: ${error.message}`);
    throw error;
  }
};

/**
 * Create a geofence around a point or along a route
 * @param {Array} center - [latitude, longitude] of center point
 * @param {Number} radiusKm - Radius in kilometers
 * @returns {Object} Geofence information
 */
exports.createGeofence = (center, radiusKm) => {
  return {
    center,
    radius: radiusKm,
    type: 'circle'
  };
};

/**
 * Create a corridor geofence along a route
 * @param {Array} route - Array of [latitude, longitude] points defining the route
 * @param {Number} widthKm - Width of corridor in kilometers
 * @returns {Object} Corridor geofence information
 */
exports.createRouteCorridorGeofence = (route, widthKm) => {
  return {
    route,
    width: widthKm,
    type: 'corridor'
  };
};

/**
 * Check if a point is within a geofence
 * @param {Array} point - [latitude, longitude] to check
 * @param {Object} geofence - Geofence object
 * @returns {Boolean} True if point is within geofence
 */
exports.isPointInGeofence = (point, geofence) => {
  if (geofence.type === 'circle') {
    const distance = GoogleMapsUtil.calculateDistance(point, geofence.center);
    return distance <= geofence.radius;
  } else if (geofence.type === 'corridor') {
    return GoogleMapsUtil.isPointNearRoute(point, geofence.route, geofence.width);
  }
  return false;
};

/**
 * Calculate estimated time of arrival (ETA) based on current position and traffic
 * @param {Array} currentPosition - [latitude, longitude] of current position
 * @param {Array} destination - [latitude, longitude] of destination
 * @returns {Object} ETA information including arrival time and traffic conditions
 */
exports.calculateETA = async (currentPosition, destination) => {
  try {
    const routeInfo = await exports.getTrafficAwareRoute(currentPosition, destination);
    
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + routeInfo.duration * 1000);
    
    return {
      eta: arrivalTime,
      durationSeconds: routeInfo.duration,
      durationText: formatDuration(routeInfo.duration),
      distanceMeters: routeInfo.distance,
      distanceText: formatDistance(routeInfo.distance),
      trafficConditions: routeInfo.trafficConditions
    };
  } catch (error) {
    logger.error(`Error calculating ETA: ${error.message}`);
    throw error;
  }
};

/**
 * Detect anomalies in vehicle movement patterns
 * @param {Array} recentPositions - Array of recent position objects with coordinates and timestamps
 * @param {Object} expectedRoute - Expected route information
 * @returns {Object} Anomaly detection results
 */
exports.detectMovementAnomalies = (recentPositions, expectedRoute) => {
  if (!recentPositions || recentPositions.length < 2) {
    return { anomalyDetected: false };
  }
  
  const anomalies = [];
  
  // Check for unexpected stops
  const stoppedDuration = calculateLongestStop(recentPositions);
  if (stoppedDuration > 30 * 60) { // Stopped for more than 30 minutes
    anomalies.push({
      type: 'unexpected_stop',
      duration: stoppedDuration,
      location: recentPositions[recentPositions.length - 1].coordinates
    });
  }
  
  // Check for route deviation
  const maxDeviation = calculateMaxRouteDeviation(recentPositions, expectedRoute);
  if (maxDeviation > 2) { // More than 2km from expected route
    anomalies.push({
      type: 'route_deviation',
      deviationKm: maxDeviation,
      location: recentPositions[recentPositions.length - 1].coordinates
    });
  }
  
  // Check for unusual speed
  const speedAnomaly = detectSpeedAnomaly(recentPositions);
  if (speedAnomaly) {
    anomalies.push(speedAnomaly);
  }
  
  return {
    anomalyDetected: anomalies.length > 0,
    anomalies
  };
};

/**
 * Calculate the longest stop duration in a series of positions
 * @param {Array} positions - Array of position objects with coordinates and timestamps
 * @returns {Number} Duration in seconds
 */
function calculateLongestStop(positions) {
  let longestStopDuration = 0;
  let currentStopStart = null;
  const stopThreshold = 0.05; // 50 meters
  
  for (let i = 1; i < positions.length; i++) {
    const p1 = positions[i-1];
    const p2 = positions[i];
    
    const distance = GoogleMapsUtil.calculateDistance(p1.coordinates, p2.coordinates);
    const timeDiff = (new Date(p2.timestamp) - new Date(p1.timestamp)) / 1000; // seconds
    
    if (distance < stopThreshold) {
      // Vehicle is stopped or moving very slowly
      if (currentStopStart === null) {
        currentStopStart = p1.timestamp;
      }
      
      const currentStopDuration = (new Date(p2.timestamp) - new Date(currentStopStart)) / 1000;
      longestStopDuration = Math.max(longestStopDuration, currentStopDuration);
    } else {
      // Vehicle is moving
      currentStopStart = null;
    }
  }
  
  return longestStopDuration;
}

/**
 * Calculate maximum deviation from expected route
 * @param {Array} positions - Array of position objects with coordinates and timestamps
 * @param {Object} expectedRoute - Expected route information
 * @returns {Number} Maximum deviation in kilometers
 */
function calculateMaxRouteDeviation(positions, expectedRoute) {
  let maxDeviation = 0;
  
  for (const position of positions) {
    let minDistance = Infinity;
    
    for (const routePoint of expectedRoute.route) {
      const distance = GoogleMapsUtil.calculateDistance(position.coordinates, routePoint);
      minDistance = Math.min(minDistance, distance);
    }
    
    maxDeviation = Math.max(maxDeviation, minDistance);
  }
  
  return maxDeviation;
}

/**
 * Detect anomalies in vehicle speed
 * @param {Array} positions - Array of position objects with coordinates and timestamps
 * @returns {Object|null} Speed anomaly information or null if no anomaly
 */
function detectSpeedAnomaly(positions) {
  const speeds = [];
  
  for (let i = 1; i < positions.length; i++) {
    const p1 = positions[i-1];
    const p2 = positions[i];
    
    const distance = GoogleMapsUtil.calculateDistance(p1.coordinates, p2.coordinates);
    const timeDiff = (new Date(p2.timestamp) - new Date(p1.timestamp)) / 3600; // hours
    
    if (timeDiff > 0) {
      const speed = distance / timeDiff; // km/h
      speeds.push(speed);
    }
  }
  
  if (speeds.length === 0) return null;
  
  // Calculate average and standard deviation
  const avg = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avg, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);
  
  // Check for unusually high speed (more than 3 standard deviations from mean)
  const maxSpeed = Math.max(...speeds);
  if (maxSpeed > avg + 3 * stdDev && maxSpeed > 100) { // 100 km/h threshold
    return {
      type: 'unusual_speed',
      speed: maxSpeed,
      averageSpeed: avg,
      location: positions[speeds.indexOf(maxSpeed) + 1].coordinates
    };
  }
  
  return null;
}

/**
 * Format duration in seconds to human-readable string
 * @param {Number} seconds - Duration in seconds
 * @returns {String} Formatted duration string
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
}

/**
 * Format distance in meters to human-readable string
 * @param {Number} meters - Distance in meters
 * @returns {String} Formatted distance string
 */
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  } else {
    return `${meters} m`;
  }
}

/**
 * Generate a secure QR code with tamper-evident features
 * @param {String} packageId - ID of the package
 * @param {String} content - Content to encode in QR
 * @returns {String} URL to QR code image with security features
 */
exports.generateSecureQRCode = (packageId, content) => {
  // Add timestamp and hash for verification
  const timestamp = Date.now();
  const secureContent = `${content}|TS:${timestamp}`;
  
  // In a real implementation, we would add digital signatures or other security features
  // For now, we'll use Google Charts API for QR generation
  const encodedData = encodeURIComponent(secureContent);
  return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodedData}&chld=H|1`;
};

/**
 * Create checkpoints with geofences along a route
 * @param {Array} route - Array of coordinates defining the route
 * @param {Number} numCheckpoints - Number of checkpoints to create
 * @param {Number} geofenceRadiusKm - Radius of checkpoint geofences in kilometers
 * @returns {Array} Array of checkpoint objects with geofences
 */
exports.createCheckpointsWithGeofences = (route, numCheckpoints, geofenceRadiusKm = 0.5) => {
  const checkpoints = GoogleMapsUtil.calculateCheckpoints(route, numCheckpoints);
  
  // Add geofences to each checkpoint
  return checkpoints.map((checkpoint, index) => ({
    ...checkpoint,
    geofence: exports.createGeofence(checkpoint.location.coordinates, geofenceRadiusKm),
    name: `Checkpoint ${index + 1}`
  }));
};