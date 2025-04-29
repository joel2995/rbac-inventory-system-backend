const VehicleTracking = require("../models/VehicleTracking");
const TamperProofPackaging = require("../models/TamperProofPackaging");
const Delivery = require("../models/Delivery");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const crypto = require("crypto");
const logger = require("../utils/Logger");
const GoogleMapsUtil = require("../utils/GoogleMapsUtil");
const EnhancedGoogleMapsUtil = require("../utils/EnhancedGoogleMapsUtil");

// ✅ Initialize enhanced tracking with traffic-aware routing and geofencing
exports.initializeEnhancedTracking = async (req, res) => {
  try {
    const { deliveryId, origin, destination, waypoints, numCheckpoints } = req.body;
    
    // Validate permissions
    if (!['admin', 'delivery_personnel'].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized to initialize enhanced tracking" });
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
    
    // Get traffic-aware route using Google Maps API
    const routeInfo = await EnhancedGoogleMapsUtil.getTrafficAwareRoute(
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
    
    // Create checkpoints with geofences
    const checkpointsWithGeofences = EnhancedGoogleMapsUtil.createCheckpointsWithGeofences(
      plannedRoute.map(point => point.coordinates),
      numCheckpoints || 3,
      0.5 // 500m geofence radius
    );
    
    // Generate OTP for delivery verification
    const deliveryOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate security token for secure updates
    const securityToken = crypto.randomBytes(20).toString('hex');
    
    // Process checkpoints and add verification codes
    const processedCheckpoints = checkpointsWithGeofences.map(checkpoint => ({
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
      expectedDeliveryTime: new Date(Date.now() + routeInfo.duration * 1000) // Based on traffic-aware ETA
    });
    
    // Update delivery status
    delivery.status = "in_transit";
    await delivery.save();
    
    // Log the tracking initialization
    logger.info(`Enhanced tracking initialized for delivery ${deliveryId} by ${req.user._id}`);
    
    res.status(201).json({
      message: "Enhanced tracking initialized successfully",
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
          distanceMeters: routeInfo.distance,
          trafficConditions: routeInfo.trafficConditions
        }
      }
    });
  } catch (error) {
    logger.error(`Error initializing enhanced tracking: ${error.message}`);
    res.status(500).json({ message: "Error initializing enhanced tracking", error: error.message });
  }
};

// ✅ Update vehicle location with enhanced anomaly detection
exports.updateEnhancedVehicleLocation = async (req, res) => {
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
    
    // Store previous location for movement analysis
    const previousLocation = tracking.currentLocation;
    
    // Update current location
    tracking.currentLocation = {
      type: "Point",
      coordinates,
      lastUpdated: timestamp ? new Date(timestamp) : new Date()
    };
    
    // Get recent position history (last 10 positions)
    const recentPositions = [
      { coordinates: previousLocation.coordinates, timestamp: previousLocation.lastUpdated },
      { coordinates, timestamp: tracking.currentLocation.lastUpdated }
    ];
    
    // Detect movement anomalies
    const anomalyResults = EnhancedGoogleMapsUtil.detectMovementAnomalies(
      recentPositions,
      { route: tracking.plannedRoute.map(point => point.coordinates) }
    );
    
    // Update tracking status based on anomalies
    if (anomalyResults.anomalyDetected) {
      tracking.status = "suspicious_activity";
      tracking.anomalyDetected = true;
      tracking.anomalyDetails = anomalyResults.anomalies.map(a => a.type).join(", ");
      
      // Log the suspicious activity
      logger.warn(`Enhanced anomaly detection for delivery ${tracking.delivery}: ${tracking.anomalyDetails}`);
      
      // Check if any packages are associated with this delivery
      const packages = await TamperProofPackaging.find({ delivery: tracking.delivery });
      if (packages.length > 0) {
        // Flag packages for verification
        for (const pkg of packages) {
          pkg.verificationHistory.push({
            timestamp: new Date(),
            location: {
              type: "Point",
              coordinates
            },
            status: "suspicious",
            notes: `Anomaly detected: ${tracking.anomalyDetails}`
          });
          await pkg.save();
        }
      }
    }
    
    // Check if we've reached a checkpoint
    if (tracking.checkpoints && tracking.checkpoints.length > 0) {
      for (let i = 0; i < tracking.checkpoints.length; i++) {
        const checkpoint = tracking.checkpoints[i];
        if (checkpoint.status === "pending") {
          const distanceToCheckpoint = GoogleMapsUtil.calculateDistance(
            coordinates,
            checkpoint.location.coordinates
          );
          
          // If within 100 meters of a checkpoint, mark it as ready for verification
          if (distanceToCheckpoint < 0.1) {
            // We don't automatically verify - that requires the verification code
            logger.info(`Vehicle for delivery ${tracking.delivery} has reached checkpoint ${checkpoint.name}`);
            break;
          }
        }
      }
    }
    
    // Calculate new ETA based on current position
    try {
      const etaInfo = await EnhancedGoogleMapsUtil.calculateETA(
        coordinates,
        tracking.endLocation.coordinates
      );
      
      // Update expected delivery time
      tracking.expectedDeliveryTime = etaInfo.eta;
      
      // If traffic conditions have changed significantly, log it
      if (etaInfo.trafficConditions === 'heavy') {
        logger.info(`Heavy traffic detected for delivery ${tracking.delivery}, ETA updated`);
        
        // If delay is significant, update status
        const originalETA = new Date(tracking.createdAt.getTime() + etaInfo.durationSeconds * 1000);
        const delayMinutes = (etaInfo.eta - originalETA) / (60 * 1000);
        
        if (delayMinutes > 30) {
          tracking.status = "delayed";
          logger.warn(`Delivery ${tracking.delivery} marked as delayed due to traffic. Delay: ${delayMinutes.toFixed(0)} minutes`);
        }
      }
    } catch (etaError) {
      logger.error(`Error updating ETA: ${etaError.message}`);
      // Continue processing even if ETA update fails
    }
    
    await tracking.save();
    
    res.status(200).json({
      message: "Enhanced location updated successfully",
      data: {
        currentLocation: tracking.currentLocation,
        status: tracking.status,
        anomalyDetected: tracking.anomalyDetected,
        anomalyDetails: tracking.anomalyDetails,
        expectedDeliveryTime: tracking.expectedDeliveryTime
      }
    });
  } catch (error) {
    logger.error(`Error updating enhanced vehicle location: ${error.message}`);
    res.status(500).json({ message: "Error updating enhanced vehicle location", error: error.message });
  }
};

// ✅ Get real-time tracking dashboard data
exports.getTrackingDashboardData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tracking = await VehicleTracking.findById(id)
      .populate("delivery", "rationItem quantity status")
      .populate("vehicle", "vehicleNumber vehicleType")
      .populate("driver", "name email")
      .populate("checkpoints.verifiedBy", "name role");
    
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Get associated packages
    const packages = await TamperProofPackaging.find({ delivery: tracking.delivery })
      .select("packageId currentStatus sealIntact tamperEvidence");
    
    // Calculate current progress percentage
    let progressPercentage = 0;
    if (tracking.status === "completed") {
      progressPercentage = 100;
    } else if (tracking.lastCheckpointPassed >= 0) {
      progressPercentage = ((tracking.lastCheckpointPassed + 1) / (tracking.checkpoints.length + 1)) * 100;
    } else {
      // Calculate based on distance traveled
      const totalDistance = GoogleMapsUtil.calculateDistance(
        tracking.startLocation.coordinates,
        tracking.endLocation.coordinates
      );
      
      const distanceTraveled = GoogleMapsUtil.calculateDistance(
        tracking.startLocation.coordinates,
        tracking.currentLocation.coordinates
      );
      
      progressPercentage = Math.min(100, Math.max(0, (distanceTraveled / totalDistance) * 100));
    }
    
    // Get updated ETA if in transit
    let etaInfo = null;
    if (tracking.status === "in_transit" || tracking.status === "delayed") {
      try {
        etaInfo = await EnhancedGoogleMapsUtil.calculateETA(
          tracking.currentLocation.coordinates,
          tracking.endLocation.coordinates
        );
      } catch (etaError) {
        logger.error(`Error calculating ETA for dashboard: ${etaError.message}`);
        // Continue without ETA if calculation fails
      }
    }
    
    res.status(200).json({
      message: "Tracking dashboard data retrieved successfully",
      data: {
        tracking: {
          _id: tracking._id,
          delivery: tracking.delivery,
          vehicle: tracking.vehicle,
          driver: tracking.driver,
          currentLocation: tracking.currentLocation,
          startLocation: tracking.startLocation,
          endLocation: tracking.endLocation,
          status: tracking.status,
          checkpoints: tracking.checkpoints,
          lastCheckpointPassed: tracking.lastCheckpointPassed,
          expectedDeliveryTime: tracking.expectedDeliveryTime,
          actualDeliveryTime: tracking.actualDeliveryTime,
          anomalyDetected: tracking.anomalyDetected,
          anomalyDetails: tracking.anomalyDetails,
          createdAt: tracking.createdAt,
          updatedAt: tracking.updatedAt
        },
        packages: packages,
        progress: {
          percentage: progressPercentage.toFixed(1),
          checkpointsPassed: tracking.lastCheckpointPassed + 1,
          totalCheckpoints: tracking.checkpoints.length
        },
        eta: etaInfo
      }
    });
  } catch (error) {
    logger.error(`Error retrieving tracking dashboard data: ${error.message}`);
    res.status(500).json({ message: "Error retrieving tracking dashboard data", error: error.message });
  }
};

// ✅ Verify checkpoint with package integrity check
exports.verifyCheckpointWithPackages = async (req, res) => {
  try {
    const { trackingId, checkpointId, verificationCode, packageScans } = req.body;
    
    // Find the tracking record
    const tracking = await VehicleTracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Find the checkpoint
    const checkpointIndex = tracking.checkpoints.findIndex(cp => cp._id.toString() === checkpointId);
    if (checkpointIndex === -1) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }
    
    const checkpoint = tracking.checkpoints[checkpointIndex];
    
    // Verify the code
    if (checkpoint.verificationCode !== verificationCode) {
      logger.warn(`Invalid verification code used for checkpoint ${checkpointId} in tracking ${trackingId}`);
      return res.status(401).json({ message: "Invalid verification code" });
    }
    
    // Update checkpoint status
    checkpoint.status = "verified";
    checkpoint.timestamp = new Date();
    checkpoint.verifiedBy = req.user._id;
    
    // Update last checkpoint passed
    tracking.lastCheckpointPassed = checkpointIndex;
    
    // Process package scans if provided
    let packageVerificationResults = [];
    if (packageScans && packageScans.length > 0) {
      const packages = await TamperProofPackaging.find({
        packageId: { $in: packageScans.map(scan => scan.packageId) },
        delivery: tracking.delivery
      });
      
      // Verify each package
      for (const scan of packageScans) {
        const pkg = packages.find(p => p.packageId === scan.packageId);
        if (pkg) {
          // Add verification record
          pkg.verificationHistory.push({
            timestamp: new Date(),
            location: {
              type: "Point",
              coordinates: checkpoint.location.coordinates
            },
            verifiedBy: req.user._id,
            status: scan.intact ? "intact" : "compromised",
            notes: `Verified at checkpoint ${checkpoint.name}`
          });
          
          // Update package status if tampered
          if (!scan.intact) {
            pkg.sealIntact = false;
            pkg.currentStatus = "compromised";
            
            // Add tamper evidence
            pkg.tamperEvidence.push({
              timestamp: new Date(),
              location: {
                type: "Point",
                coordinates: checkpoint.location.coordinates
              },
              reportedBy: req.user._id,
              description: scan.notes || "Tampering detected during checkpoint verification"
            });
            
            // Log tampering
            logger.warn(`Package tampering detected at checkpoint for ${pkg.packageId}`);
          }
          
          await pkg.save();
          
          packageVerificationResults.push({
            packageId: pkg.packageId,
            verified: true,
            status: scan.intact ? "intact" : "compromised"
          });
        } else {
          packageVerificationResults.push({
            packageId: scan.packageId,
            verified: false,
            status: "not_found"
          });
        }
      }
    }
    
    await tracking.save();
    
    logger.info(`Checkpoint ${checkpoint.name} verified for delivery ${tracking.delivery} by ${req.user._id}`);
    
    res.status(200).json({
      message: "Checkpoint verified successfully with package integrity check",
      data: {
        checkpoint: {
          id: checkpoint._id,
          name: checkpoint.name,
          status: checkpoint.status,
          timestamp: checkpoint.timestamp
        },
        nextCheckpoint: checkpointIndex < tracking.checkpoints.length - 1 ? {
          id: tracking.checkpoints[checkpointIndex + 1]._id,
          name: tracking.checkpoints[checkpointIndex + 1].name,
          location: tracking.checkpoints[checkpointIndex + 1].location
        } : null,
        packageVerifications: packageVerificationResults
      }
    });
  } catch (error) {
    logger.error(`Error verifying checkpoint with packages: ${error.message}`);
    res.status(500).json({ message: "Error verifying checkpoint with packages", error: error.message });
  }
};

// ✅ Complete delivery with package verification
exports.completeDeliveryWithPackageVerification = async (req, res) => {
  try {
    const { trackingId, otp, packageVerifications } = req.body;
    
    // Find the tracking record
    const tracking = await VehicleTracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Verify OTP
    if (tracking.deliveryOTP !== otp) {
      logger.warn(`Invalid OTP used for delivery completion ${trackingId}`);
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
      delivery.arrivalTime = new Date();
      await delivery.save();
    }
    
    // Process package verifications if provided
    let packageResults = [];
    if (packageVerifications && packageVerifications.length > 0) {
      const packages = await TamperProofPackaging.find({
        packageId: { $in: packageVerifications.map(v => v.packageId) },
        delivery: tracking.delivery
      });
      
      // Update each package
      for (const verification of packageVerifications) {
        const pkg = packages.find(p => p.packageId === verification.packageId);
        if (pkg) {
          // Update package status
          pkg.currentStatus = "delivered";
          
          // If package is reported as tampered
          if (!verification.intact) {
            pkg.sealIntact = false;
            
            // Add tamper evidence
            pkg.tamperEvidence.push({
              timestamp: new Date(),
              location: {
                type: "Point",
                coordinates: tracking.currentLocation.coordinates
              },
              reportedBy: req.user._id,
              description: verification.notes || "Tampering detected during delivery verification"
            });
          }
          
          // Add verification record
          pkg.verificationHistory.push({
            timestamp: new Date(),
            location: {
              type: "Point",
              coordinates: tracking.currentLocation.coordinates
            },
            verifiedBy: req.user._id,
            status: verification.intact ? "intact" : "compromised",
            notes: "Final delivery verification"
          });
          
          await pkg.save();
          
          packageResults.push({
            packageId: pkg.packageId,
            verified: true,
            status: verification.intact ? "intact" : "compromised"
          });
        } else {
          packageResults.push({
            packageId: verification.packageId,
            verified: false,
            status: "not_found"
          });
        }
      }
    }
    
    logger.info(`Delivery ${tracking.delivery} completed with package verification by ${req.user._id}`);
    
    res.status(200).json({
      message: "Delivery completed successfully with package verification",
      data: {
        trackingId: tracking._id,
        deliveryId: tracking.delivery,
        status: tracking.status,
        completedAt: tracking.actualDeliveryTime,
        packageVerifications: packageResults
      }
    });
  } catch (error) {
    logger.error(`Error completing delivery with package verification: ${error.message}`);
    res.status(500).json({ message: "Error completing delivery with package verification", error: error.message });
  }
};