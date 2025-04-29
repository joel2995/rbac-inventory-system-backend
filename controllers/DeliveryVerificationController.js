const DeliveryVerification = require("../models/DeliveryVerification");
const Delivery = require("../models/Delivery");
const VehicleTracking = require("../models/VehicleTracking");
const logger = require("../utils/Logger");

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Generate OTP for delivery verification
exports.generateDeliveryOTP = async (req, res) => {
  try {
    const { deliveryId } = req.body;
    
    // Check if user is authorized
    if (!['admin', 'delivery_personnel', 'pds_shop_owner'].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized to generate OTP" });
    }
    
    // Find the delivery
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    
    // Check if delivery is in transit
    if (delivery.status !== "in_transit") {
      return res.status(400).json({ message: `Cannot generate OTP for delivery with status: ${delivery.status}` });
    }
    
    // Check if there's an existing verification
    let verification = await DeliveryVerification.findOne({ delivery: deliveryId });
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // OTP expires in 30 minutes
    
    if (verification) {
      // Update existing verification
      verification.otp.code = otp;
      verification.otp.generatedAt = new Date();
      verification.otp.expiresAt = expiresAt;
      verification.otp.attempts = 0;
      verification.verificationStatus = "pending";
    } else {
      // Create new verification
      verification = new DeliveryVerification({
        delivery: deliveryId,
        otp: {
          code: otp,
          generatedAt: new Date(),
          expiresAt: expiresAt,
          attempts: 0,
          maxAttempts: 3
        },
        verificationStatus: "pending"
      });
    }
    
    await verification.save();
    
    // Also update the OTP in vehicle tracking if it exists
    const tracking = await VehicleTracking.findOne({ delivery: deliveryId });
    if (tracking) {
      tracking.deliveryOTP = otp;
      await tracking.save();
    }
    
    logger.info(`OTP generated for delivery ${deliveryId} by ${req.user._id}`);
    
    res.status(200).json({
      message: "OTP generated successfully",
      data: {
        deliveryId,
        otp,
        expiresAt
      }
    });
  } catch (error) {
    logger.error(`Error generating OTP: ${error.message}`);
    res.status(500).json({ message: "Error generating OTP", error: error.message });
  }
};

// ✅ Verify delivery with OTP
exports.verifyDeliveryOTP = async (req, res) => {
  try {
    const { deliveryId, otp } = req.body;
    
    // Find the verification
    const verification = await DeliveryVerification.findOne({ delivery: deliveryId });
    if (!verification) {
      return res.status(404).json({ message: "Verification record not found" });
    }
    
    // Check if OTP is expired
    if (new Date() > new Date(verification.otp.expiresAt)) {
      verification.verificationStatus = "expired";
      await verification.save();
      return res.status(400).json({ message: "OTP has expired" });
    }
    
    // Check if max attempts reached
    if (verification.otp.attempts >= verification.otp.maxAttempts) {
      verification.verificationStatus = "failed";
      await verification.save();
      return res.status(400).json({ message: "Maximum verification attempts reached" });
    }
    
    // Verify OTP
    if (verification.otp.code !== otp) {
      verification.otp.attempts += 1;
      await verification.save();
      return res.status(401).json({ 
        message: "Invalid OTP", 
        attemptsLeft: verification.otp.maxAttempts - verification.otp.attempts 
      });
    }
    
    // OTP is valid, update verification status
    verification.verificationStatus = "verified";
    verification.verifiedBy = {
      userId: req.user._id,
      role: req.user.role,
      timestamp: new Date()
    };
    
    await verification.save();
    
    // Update delivery status
    const delivery = await Delivery.findById(deliveryId);
    if (delivery) {
      delivery.status = "delivered";
      delivery.arrivalTime = new Date();
      await delivery.save();
    }
    
    // Update tracking status if it exists
    const tracking = await VehicleTracking.findOne({ delivery: deliveryId });
    if (tracking) {
      tracking.status = "completed";
      tracking.otpVerified = true;
      tracking.actualDeliveryTime = new Date();
      await tracking.save();
    }
    
    logger.info(`Delivery ${deliveryId} verified with OTP by ${req.user._id}`);
    
    res.status(200).json({
      message: "Delivery verified successfully",
      data: {
        deliveryId,
        verificationStatus: verification.verificationStatus,
        verifiedAt: verification.verifiedBy.timestamp
      }
    });
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    res.status(500).json({ message: "Error verifying OTP", error: error.message });
  }
};

// ✅ Report delivery integrity issues
exports.reportIntegrityIssues = async (req, res) => {
  try {
    const { deliveryId, issues } = req.body;
    
    // Find the verification
    let verification = await DeliveryVerification.findOne({ delivery: deliveryId });
    if (!verification) {
      // Create a new verification record if it doesn't exist
      verification = new DeliveryVerification({
        delivery: deliveryId,
        otp: {
          code: generateOTP(),
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          attempts: 0,
          maxAttempts: 3
        },
        verificationStatus: "pending"
      });
    }
    
    // Update integrity information
    verification.deliveryIntegrity = {
      isIntact: false,
      issues: issues.map(issue => ({
        description: issue.description,
        reportedAt: new Date(),
        reportedBy: req.user._id,
        evidence: issue.evidence || ""
      }))
    };
    
    await verification.save();
    
    // Log the integrity issues
    logger.warn(`Integrity issues reported for delivery ${deliveryId} by ${req.user._id}`);
    
    res.status(200).json({
      message: "Integrity issues reported successfully",
      data: {
        deliveryId,
        issues: verification.deliveryIntegrity.issues
      }
    });
  } catch (error) {
    logger.error(`Error reporting integrity issues: ${error.message}`);
    res.status(500).json({ message: "Error reporting integrity issues", error: error.message });
  }
};

// ✅ Get verification details
exports.getVerificationDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const verification = await DeliveryVerification.findOne({ delivery: deliveryId })
      .populate("delivery", "rationItem quantity status")
      .populate("verifiedBy.userId", "name role");
    
    if (!verification) {
      return res.status(404).json({ message: "Verification record not found" });
    }
    
    // Don't expose the OTP code in the response
    const responseData = {
      ...verification.toObject(),
      otp: {
        ...verification.otp,
        code: undefined // Remove the actual OTP code
      }
    };
    
    res.status(200).json({
      message: "Verification details retrieved successfully",
      data: responseData
    });
  } catch (error) {
    logger.error(`Error retrieving verification details: ${error.message}`);
    res.status(500).json({ message: "Error retrieving verification details", error: error.message });
  }
};

// ✅ Get all verifications (for admin)
exports.getAllVerifications = async (req, res) => {
  try {
    // Only admin can access all verifications
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to access all verifications" });
    }
    
    const verifications = await DeliveryVerification.find()
      .populate("delivery", "rationItem quantity status")
      .populate("verifiedBy.userId", "name role");
    
    // Don't expose the OTP codes in the response
    const responseData = verifications.map(verification => {
      const verificationObj = verification.toObject();
      if (verificationObj.otp) {
        verificationObj.otp.code = undefined; // Remove the actual OTP code
      }
      return verificationObj;
    });
    
    res.status(200).json({
      message: "All verifications retrieved successfully",
      count: verifications.length,
      data: responseData
    });
  } catch (error) {
    logger.error(`Error retrieving all verifications: ${error.message}`);
    res.status(500).json({ message: "Error retrieving all verifications", error: error.message });
  }
};