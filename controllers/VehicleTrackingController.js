const VehicleTracking = require("../models/VehicleTracking");
const Delivery = require("../models/Delivery");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const crypto = require("crypto");
const logger = require("../utils/Logger");
const GoogleMapsUtil = require("../utils/GoogleMapsUtil");

// ✅ Initialize tracking for a delivery
exports.initializeTracking = async (req, res) => {
  try {
    const { deliveryId, origin, destination, waypoints, numCheckpoints } = req.body;
    
    // Validate permissions
    if (!['admin', 'delivery_personnel'].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized to initialize tracking" });
    }
    
    // Get delivery details
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    
    // Check if tracking already exists
    const existingTracking = await VehicleTracking.findOne({ delivery: deliveryId });
    if (existingTracking) {
      return res.status(400).json({ message: "Tracking already initialized for this delivery" });
    }
    
    // Get route using Google Maps API
    const routeInfo = await GoogleMapsUtil.getRoute(
      origin,
      destination,
      waypoints || []
    );
    
    // Format route points for database storage
    const plannedRoute = routeInfo.steps.map(step => ({
      type: "Point",
      coordinates: step.startLocation
    }));
    
    // Add destination as final point
    plannedRoute.push({
      type: "Point",
      coordinates: routeInfo.steps[routeInfo.steps.length - 1].endLocation
    });
    
    // Create checkpoints
    const checkpoints = GoogleMapsUtil.createCheckpoints(
      plannedRoute.map(point => point.coordinates),
      numCheckpoints || 3
    );
    
    // Generate OTP for delivery verification
    const deliveryOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate security token for secure updates
    const securityToken = crypto.randomBytes(20).toString('hex');
    
    // Process checkpoints and add verification codes
    const processedCheckpoints = checkpoints.map(checkpoint => ({
      ...checkpoint,
      verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
      status: "pending"
    }));
    
    // Create tracking record
    const tracking = await VehicleTracking.create({
      delivery: deliveryId,
      vehicle: delivery.vehicle,
      driver: delivery.driver,
      startLocation: {
        type: "Point",
        coordinates: origin
      },
      endLocation: {
        type: "Point",
        coordinates: destination
      },
      currentLocation: {
        type: "Point",
        coordinates: origin,
        lastUpdated: new Date()
      },
      plannedRoute,
      checkpoints: processedCheckpoints,
      status: "preparing",
      deliveryOTP,
      securityToken,
      expectedDeliveryTime: new Date(Date.now() + routeInfo.duration * 1000)
    });
    
    // Update delivery status
    delivery.status = "in_transit";
    await delivery.save();
    
    // Log the tracking initialization
    logger.info(`Tracking initialized for delivery ${deliveryId} by ${req.user._id}`);
    
    res.status(201).json({
      message: "Tracking initialized successfully",
      data: {
        trackingId: tracking._id,
        checkpoints: tracking.checkpoints.map(cp => ({
          id: cp._id,
          name: cp.name,
          location: cp.location,
          verificationCode: cp.verificationCode
        })),
        deliveryOTP,
        securityToken,
        estimatedArrival: {
          time: tracking.expectedDeliveryTime,
          durationSeconds: routeInfo.duration,
          distanceMeters: routeInfo.distance
        }
      }
    });
  } catch (error) {
    logger.error(`Error initializing tracking: ${error.message}`);
    res.status(500).json({ message: "Error initializing tracking", error: error.message });
  }
};

// ✅ Update vehicle location
exports.updateVehicleLocation = async (req, res) => {
  try {
    const { trackingId, coordinates, securityToken, timestamp } = req.body;
    
    // Find the tracking record
    const tracking = await VehicleTracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Verify security token
    if (tracking.securityToken !== securityToken) {
      logger.warn(`Invalid security token used for tracking ${trackingId}`);
      return res.status(401).json({ message: "Invalid security token" });
    }
    
    // Update current location
    tracking.currentLocation = {
      type: "Point",
      coordinates,
      lastUpdated: timestamp ? new Date(timestamp) : new Date()
    };
    
    // Check if we've reached a checkpoint
    if (tracking.checkpoints && tracking.checkpoints.length > 0) {
      for (let i = 0; i < tracking.checkpoints.length; i++) {
        const checkpoint = tracking.checkpoints[i];
        if (checkpoint.status === "pending" && i > tracking.lastCheckpointPassed) {
          // Calculate distance to checkpoint
          const distance = GoogleMapsUtil.calculateDistance(
            coordinates,
            checkpoint.location.coordinates
          );
          
          // If within 100 meters of checkpoint, mark as approaching
          if (distance < 100) {
            logger.info(`Vehicle approaching checkpoint ${i+1} for delivery ${tracking.delivery}`);
            // We don't automatically verify - that requires the verification code
          }
        }
      }
    }
    
    await tracking.save();
    
    res.status(200).json({
      message: "Location updated successfully",
      data: {
        currentLocation: tracking.currentLocation,
        nextCheckpoint: tracking.lastCheckpointPassed < tracking.checkpoints.length - 1 ? 
          tracking.checkpoints[tracking.lastCheckpointPassed + 1] : null
      }
    });
  } catch (error) {
    logger.error(`Error updating vehicle location: ${error.message}`);
    res.status(500).json({ message: "Error updating vehicle location", error: error.message });
  }
};

// ✅ Verify checkpoint passage
exports.verifyCheckpoint = async (req, res) => {
  try {
    const { trackingId, checkpointIndex, verificationCode } = req.body;
    
    // Find the tracking record
    const tracking = await VehicleTracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Validate checkpoint index
    if (checkpointIndex < 0 || checkpointIndex >= tracking.checkpoints.length) {
      return res.status(400).json({ message: "Invalid checkpoint index" });
    }
    
    // Get the checkpoint
    const checkpoint = tracking.checkpoints[checkpointIndex];
    
    // Check if checkpoint is already verified
    if (checkpoint.status === "verified") {
      return res.status(400).json({ message: "Checkpoint already verified" });
    }
    
    // Verify the code
    if (checkpoint.verificationCode !== verificationCode) {
      return res.status(401).json({ message: "Invalid verification code" });
    }
    
    // Update checkpoint status
    checkpoint.status = "verified";
    checkpoint.verifiedBy = req.user._id;
    checkpoint.timestamp = new Date();
    
    // Update last checkpoint passed
    tracking.lastCheckpointPassed = checkpointIndex;
    
    // Update tracking status if needed
    if (tracking.status === "preparing") {
      tracking.status = "in_transit";
    }
    
    await tracking.save();
    
    logger.info(`Checkpoint ${checkpointIndex + 1} verified for delivery ${tracking.delivery} by ${req.user._id}`);
    
    res.status(200).json({
      message: "Checkpoint verified successfully",
      data: {
        checkpoint: checkpoint,
        nextCheckpoint: checkpointIndex < tracking.checkpoints.length - 1 ? 
          tracking.checkpoints[checkpointIndex + 1] : null
      }
    });
  } catch (error) {
    logger.error(`Error verifying checkpoint: ${error.message}`);
    res.status(500).json({ message: "Error verifying checkpoint", error: error.message });
  }
};

// ✅ Report suspicious activity or tampering
exports.reportTampering = async (req, res) => {
  try {
    const { trackingId, description, coordinates } = req.body;
    
    // Find the tracking record
    const tracking = await VehicleTracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Add tamper attempt record
    tracking.tamperAttempts.push({
      timestamp: new Date(),
      description,
      location: {
        type: "Point",
        coordinates
      }
    });
    
    // Update tracking status
    tracking.status = "suspicious_activity";
    tracking.anomalyDetected = true;
    tracking.anomalyDetails = description;
    
    await tracking.save();
    
    // Log the tampering report
    logger.warn(`Tampering reported for delivery ${tracking.delivery} by ${req.user._id}: ${description}`);
    
    res.status(200).json({
      message: "Tampering report submitted successfully",
      data: {
        tamperAttempt: tracking.tamperAttempts[tracking.tamperAttempts.length - 1],
        status: tracking.status
      }
    });
  } catch (error) {
    logger.error(`Error reporting tampering: ${error.message}`);
    res.status(500).json({ message: "Error reporting tampering", error: error.message });
  }
};

// ✅ Get tracking details
exports.getTrackingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the tracking record with populated references
    const tracking = await VehicleTracking.findById(id)
      .populate('delivery')
      .populate('vehicle')
      .populate('driver', 'name email phone role');
    
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Check permissions for non-admin users
    if (req.user.role !== 'admin') {
      // Delivery personnel can only access their own deliveries
      if (req.user.role === 'delivery_personnel' && tracking.driver._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized to access this tracking record" });
      }
      
      // PDS shop owners can only access deliveries to their shop
      if (req.user.role === 'pds_shop_owner' && tracking.delivery.destination.toString() !== req.user.pdsShop.toString()) {
        return res.status(403).json({ message: "Unauthorized to access this tracking record" });
      }
    }
    
    res.status(200).json({
      message: "Tracking details retrieved successfully",
      data: tracking
    });
  } catch (error) {
    logger.error(`Error retrieving tracking details: ${error.message}`);
    res.status(500).json({ message: "Error retrieving tracking details", error: error.message });
  }
};

// ✅ Get all active trackings
exports.getAllActiveTrackings = async (req, res) => {
  try {
    // Build query based on user role
    let query = { status: { $ne: "completed" } };
    
    if (req.user.role === 'delivery_personnel') {
      // Delivery personnel can only see their own deliveries
      query.driver = req.user._id;
    }
    
    // Find active tracking records
    const trackings = await VehicleTracking.find(query)
      .populate('delivery')
      .populate('vehicle')
      .populate('driver', 'name email phone role');
    
    res.status(200).json({
      message: "Active trackings retrieved successfully",
      count: trackings.length,
      data: trackings
    });
  } catch (error) {
    logger.error(`Error retrieving active trackings: ${error.message}`);
    res.status(500).json({ message: "Error retrieving active trackings", error: error.message });
  }
};

// ✅ Complete delivery with OTP verification
exports.completeDeliveryWithOTP = async (req, res) => {
  try {
    // Accept both 'otp' and 'deliveryOTP' parameters for better compatibility
    const { trackingId, otp, deliveryOTP } = req.body;
    const otpValue = deliveryOTP || otp; // Prioritize deliveryOTP if present
    
    // Find the tracking record
    const tracking = await VehicleTracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Check if delivery is already completed
    if (tracking.status === "completed") {
      return res.status(400).json({ message: "Delivery already completed" });
    }
    
    // Verify OTP
    if (tracking.deliveryOTP !== otpValue) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    
    // Update tracking status
    tracking.status = "completed";
    tracking.otpVerified = true;
    tracking.actualDeliveryTime = new Date();
    
    await tracking.save();
    
    // Update delivery status
    const delivery = await Delivery.findById(tracking.delivery);
    if (delivery) {
      delivery.status = "delivered";
      delivery.deliveredAt = new Date();
      await delivery.save();
    }
    
    logger.info(`Delivery ${tracking.delivery} completed with OTP verification by ${req.user._id}`);
    
    res.status(200).json({
      message: "Delivery completed successfully",
      data: {
        trackingId: tracking._id,
        deliveryId: tracking.delivery,
        completedAt: tracking.actualDeliveryTime
      }
    });
  } catch (error) {
    logger.error(`Error completing delivery: ${error.message}`);
    res.status(500).json({ message: "Error completing delivery", error: error.message });
  }
};