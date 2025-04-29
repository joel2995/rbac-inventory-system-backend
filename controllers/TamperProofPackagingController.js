const TamperProofPackaging = require("../models/TamperProofPackaging");
const Stock = require("../models/Stock");
const Delivery = require("../models/Delivery");
const VehicleTracking = require("../models/VehicleTracking");
const logger = require("../utils/Logger");
const GoogleMapsUtil = require("../utils/GoogleMapsUtil");
const crypto = require("crypto");

// Helper function to generate unique package ID
const generatePackageId = () => {
  return `PKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Helper function to generate QR code content
const generateQRContent = (packageId, deliveryId, batchNumber) => {
  const content = `{"packageId":"${packageId}","deliveryId":"${deliveryId}","batchNumber":"${batchNumber}","timestamp":${Date.now()}}`;
  return content;
};

// Helper function to generate barcode
const generateBarcode = (packageId) => {
  return `BAR-${packageId}`;
};

// Helper function to verify if a package is at the expected location
const verifyPackageLocation = async (packageLocation, expectedRoute) => {
  // Use Google Maps API to check if package is on the expected route
  try {
    const maxAllowedDistance = 1; // 1 km
    return GoogleMapsUtil.isPointNearRoute(packageLocation, expectedRoute, maxAllowedDistance);
  } catch (error) {
    logger.error(`Error verifying package location: ${error.message}`);
    return false;
  }
};

// ✅ Create tamper-proof packaging for stock items in a delivery
exports.createPackaging = async (req, res) => {
  try {
    const { deliveryId, stockIds, batchNumber, securityFeatures } = req.body;
    
    // Validate permissions
    if (!['admin', 'godown_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized to create tamper-proof packaging" });
    }
    
    // Get delivery details
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    
    // Verify stocks exist
    const stocks = await Stock.find({ _id: { $in: stockIds } });
    if (stocks.length !== stockIds.length) {
      return res.status(404).json({ message: "One or more stock items not found" });
    }
    
    // Create tamper-proof packaging for each stock
    const packagingPromises = stocks.map(async (stock) => {
      const packageId = generatePackageId();
      const qrContent = generateQRContent(packageId, deliveryId, batchNumber);
      const qrCode = GoogleMapsUtil.generateQRCode(packageId, qrContent);
      const barcode = generateBarcode(packageId);
      
      return TamperProofPackaging.create({
        stock: stock._id,
        delivery: deliveryId,
        batchNumber,
        packageId,
        qrCode,
        barcode,
        securityFeatures: securityFeatures || {
          tamperEvidentTape: true,
          securitySeals: true,
          rfidTag: false
        },
        currentStatus: "sealed"
      });
    });
    
    const packagingResults = await Promise.all(packagingPromises);
    
    // Log the packaging creation
    logger.info(`Tamper-proof packaging created for delivery ${deliveryId} by ${req.user._id}`);
    
    res.status(201).json({
      message: "Tamper-proof packaging created successfully",
      data: packagingResults
    });
  } catch (error) {
    logger.error(`Error creating tamper-proof packaging: ${error.message}`);
    res.status(500).json({ message: "Error creating tamper-proof packaging", error: error.message });
  }
};

// ✅ Verify package integrity during transit
exports.verifyPackageIntegrity = async (req, res) => {
  try {
    const { packageId, coordinates, notes } = req.body;
    
    // Find the package
    const packaging = await TamperProofPackaging.findOne({ packageId });
    if (!packaging) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    // Get the delivery tracking information
    const tracking = await VehicleTracking.findOne({ delivery: packaging.delivery });
    if (!tracking) {
      return res.status(404).json({ message: "Tracking information not found" });
    }
    
    // Verify if package is on the expected route
    const isOnRoute = await verifyPackageLocation(
      coordinates,
      tracking.plannedRoute.map(point => point.coordinates)
    );
    
    // Determine status based on location verification
    let status = "intact";
    if (!isOnRoute) {
      status = "suspicious";
      logger.warn(`Package ${packageId} detected off-route at coordinates [${coordinates}]`);
    }
    
    // Add verification record
    packaging.verificationHistory.push({
      timestamp: new Date(),
      location: {
        type: "Point",
        coordinates
      },
      verifiedBy: req.user._id,
      status,
      notes
    });
    
    // Update current status if needed
    if (status === "suspicious" && packaging.currentStatus !== "compromised") {
      packaging.currentStatus = "in_transit";
    }
    
    await packaging.save();
    
    res.status(200).json({
      message: "Package integrity verified",
      data: {
        packageId: packaging.packageId,
        status,
        isOnRoute,
        verificationHistory: packaging.verificationHistory
      }
    });
  } catch (error) {
    logger.error(`Error verifying package integrity: ${error.message}`);
    res.status(500).json({ message: "Error verifying package integrity", error: error.message });
  }
};

// ✅ Report package tampering
exports.reportTampering = async (req, res) => {
  try {
    const { packageId, coordinates, description, images } = req.body;
    
    // Find the package
    const packaging = await TamperProofPackaging.findOne({ packageId });
    if (!packaging) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    // Update package status
    packaging.sealIntact = false;
    packaging.currentStatus = "compromised";
    
    // Add tamper evidence
    packaging.tamperEvidence.push({
      timestamp: new Date(),
      location: {
        type: "Point",
        coordinates
      },
      reportedBy: req.user._id,
      description,
      images: images || []
    });
    
    await packaging.save();
    
    // Update vehicle tracking to suspicious activity
    const tracking = await VehicleTracking.findOne({ delivery: packaging.delivery });
    if (tracking) {
      tracking.status = "suspicious_activity";
      tracking.anomalyDetected = true;
      tracking.anomalyDetails = `Package tampering reported: ${description}`;
      
      // Add tamper attempt to vehicle tracking
      tracking.tamperAttempts.push({
        timestamp: new Date(),
        description: `Package tampering: ${description}`,
        location: {
          type: "Point",
          coordinates
        }
      });
      
      await tracking.save();
    }
    
    // Log the tampering report
    logger.warn(`Package tampering reported for ${packageId} by ${req.user._id}: ${description}`);
    
    res.status(200).json({
      message: "Package tampering reported successfully",
      data: {
        packageId: packaging.packageId,
        currentStatus: packaging.currentStatus,
        tamperEvidence: packaging.tamperEvidence
      }
    });
  } catch (error) {
    logger.error(`Error reporting package tampering: ${error.message}`);
    res.status(500).json({ message: "Error reporting package tampering", error: error.message });
  }
};

// ✅ Get package details
exports.getPackageDetails = async (req, res) => {
  try {
    const { packageId } = req.params;
    
    const packaging = await TamperProofPackaging.findOne({ packageId })
      .populate("stock", "rationItem quantity")
      .populate("delivery", "status destination")
      .populate("tamperEvidence.reportedBy", "name role")
      .populate("tamperEvidence.verifiedBy", "name role")
      .populate("verificationHistory.verifiedBy", "name role");
    
    if (!packaging) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    res.status(200).json({
      message: "Package details retrieved successfully",
      data: packaging
    });
  } catch (error) {
    logger.error(`Error retrieving package details: ${error.message}`);
    res.status(500).json({ message: "Error retrieving package details", error: error.message });
  }
};

// ✅ Get all packages for a delivery
exports.getDeliveryPackages = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const packages = await TamperProofPackaging.find({ delivery: deliveryId })
      .populate("stock", "rationItem quantity")
      .select("-tamperEvidence -verificationHistory");
    
    res.status(200).json({
      message: "Delivery packages retrieved successfully",
      count: packages.length,
      data: packages
    });
  } catch (error) {
    logger.error(`Error retrieving delivery packages: ${error.message}`);
    res.status(500).json({ message: "Error retrieving delivery packages", error: error.message });
  }
};

// ✅ Scan package QR/barcode
exports.scanPackage = async (req, res) => {
  try {
    const { code, coordinates } = req.body;
    
    // Determine if it's a QR code or barcode
    let query = {};
    if (code.startsWith('BAR-')) {
      query = { barcode: code };
    } else {
      // Assume it's a QR code content or packageId
      try {
        // Try to parse as JSON (QR content)
        const qrData = JSON.parse(code);
        query = { packageId: qrData.packageId };
      } catch (e) {
        // If not JSON, try as direct packageId
        query = { packageId: code };
      }
    }
    
    const packaging = await TamperProofPackaging.findOne(query)
      .populate("stock", "rationItem quantity")
      .populate("delivery");
    
    if (!packaging) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    // Add verification record if coordinates provided
    if (coordinates) {
      packaging.verificationHistory.push({
        timestamp: new Date(),
        location: {
          type: "Point",
          coordinates
        },
        verifiedBy: req.user._id,
        status: "intact",
        notes: "Scanned via mobile app"
      });
      
      await packaging.save();
    }
    
    res.status(200).json({
      message: "Package scanned successfully",
      data: {
        packageId: packaging.packageId,
        batchNumber: packaging.batchNumber,
        stock: packaging.stock,
        delivery: packaging.delivery,
        currentStatus: packaging.currentStatus,
        sealIntact: packaging.sealIntact,
        securityFeatures: packaging.securityFeatures
      }
    });
  } catch (error) {
    logger.error(`Error scanning package: ${error.message}`);
    res.status(500).json({ message: "Error scanning package", error: error.message });
  }
};

// ✅ Update package status on delivery completion
exports.completePackageDelivery = async (req, res) => {
  try {
    const { packageId, coordinates, notes } = req.body;
    
    // Find the package
    const packaging = await TamperProofPackaging.findOne({ packageId });
    if (!packaging) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    // Update package status
    packaging.currentStatus = "delivered";
    
    // Add verification record
    packaging.verificationHistory.push({
      timestamp: new Date(),
      location: {
        type: "Point",
        coordinates
      },
      verifiedBy: req.user._id,
      status: packaging.sealIntact ? "intact" : "compromised",
      notes: notes || "Delivery completed"
    });
    
    await packaging.save();
    
    // Log the delivery completion
    logger.info(`Package ${packageId} delivery completed by ${req.user._id}`);
    
    res.status(200).json({
      message: "Package delivery completed successfully",
      data: {
        packageId: packaging.packageId,
        currentStatus: packaging.currentStatus,
        sealIntact: packaging.sealIntact
      }
    });
  } catch (error) {
    logger.error(`Error completing package delivery: ${error.message}`);
    res.status(500).json({ message: "Error completing package delivery", error: error.message });
  }
};