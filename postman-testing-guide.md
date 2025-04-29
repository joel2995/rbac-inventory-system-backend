# RBAC Inventory System API Testing Guide

This guide provides instructions for testing the five key features of the RBAC Inventory System using Postman:

1. Real-time Vehicle Tracking
2. OTP Delivery Verification
3. Tamper-Proof Packaging with QR/Barcode
4. Enhanced GPS Tracking with Google Maps API
5. Checkpoint Verification

## Base URL

```
http://localhost:5000
```

## Authentication

Before testing any of the features, you need to authenticate:

### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Response**: Copy the `token` from the response for use in subsequent requests
- **Set Authorization**: In Postman, set the Authorization type to "Bearer Token" and paste the token

## 1. Real-time Vehicle Tracking

### Initialize Tracking

- **URL**: `/api/vehicle-tracking/initialize`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "deliveryId": "<delivery_id>",
    "plannedRoute": [
      {
        "coordinates": [77.2090, 28.6139],
        "name": "Start Point"
      },
      {
        "coordinates": [77.2300, 28.6500],
        "name": "Midpoint"
      },
      {
        "coordinates": [77.2500, 28.7000],
        "name": "End Point"
      }
    ],
    "checkpoints": [
      {
        "name": "Checkpoint 1",
        "location": {
          "type": "Point",
          "coordinates": [77.2200, 28.6300]
        }
      },
      {
        "name": "Checkpoint 2",
        "location": {
          "type": "Point",
          "coordinates": [77.2400, 28.6800]
        }
      }
    ]
  }
  ```
- **Response**: Save the `trackingId`, `securityToken`, and `deliveryOTP` from the response

### Update Vehicle Location

- **URL**: `/api/vehicle-tracking/update-location`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "coordinates": [77.2200, 28.6300],
    "securityToken": "<security_token>"
  }
  ```
- **Note**: This endpoint doesn't require authentication as it uses the security token

### Verify Checkpoint

- **URL**: `/api/vehicle-tracking/verify-checkpoint`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "checkpointId": "<checkpoint_id>",
    "verificationCode": "<verification_code>"
  }
  ```
- **Note**: Get the `checkpointId` and `verificationCode` from the initialize tracking response

### Get Tracking Details

- **URL**: `/api/vehicle-tracking/<tracking_id>`
- **Method**: `GET`

### Complete Delivery with OTP

- **URL**: `/api/vehicle-tracking/complete`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "deliveryOTP": "<delivery_otp>"
  }
  ```

## 2. OTP Delivery Verification

### Generate OTP

- **URL**: `/api/delivery-verification/generate-otp`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "deliveryId": "<delivery_id>"
  }
  ```
- **Response**: Save the `otp` from the response

### Verify OTP

- **URL**: `/api/delivery-verification/verify-otp`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "deliveryId": "<delivery_id>",
    "otp": "<otp>"
  }
  ```

### Get Verification Details

- **URL**: `/api/delivery-verification/<delivery_id>`
- **Method**: `GET`

## 3. Tamper-Proof Packaging with QR/Barcode

### Create Packaging

- **URL**: `/api/tamper-proof-packaging/create`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "deliveryId": "<delivery_id>",
    "stockIds": ["<stock_id_1>", "<stock_id_2>"],
    "batchNumber": "BATCH-001",
    "securityFeatures": {
      "tamperEvidentTape": true,
      "securitySeals": true,
      "rfidTag": false
    }
  }
  ```
- **Response**: Save the `packageId` from the response

### Verify Package Integrity

- **URL**: `/api/tamper-proof-packaging/verify`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "packageId": "<package_id>",
    "coordinates": [77.2300, 28.6500],
    "notes": "Package appears intact"
  }
  ```

### Scan Package QR/Barcode

- **URL**: `/api/tamper-proof-packaging/scan`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "packageId": "<package_id>",
    "coordinates": [77.2300, 28.6500]
  }
  ```

### Get Package Details

- **URL**: `/api/tamper-proof-packaging/package/<package_id>`
- **Method**: `GET`

## 4. Enhanced GPS Tracking with Google Maps API

### Initialize Enhanced Tracking

- **URL**: `/api/enhanced-tracking/initialize`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "deliveryId": "<delivery_id>",
    "origin": [77.2090, 28.6139],
    "destination": [77.2500, 28.7000],
    "waypoints": [
      [77.2200, 28.6300],
      [77.2400, 28.6800]
    ],
    "numCheckpoints": 3
  }
  ```
- **Response**: Save the `trackingId`, `securityToken`, and checkpoint information

### Update Enhanced Vehicle Location

- **URL**: `/api/enhanced-tracking/update-location`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "coordinates": [77.2200, 28.6300],
    "securityToken": "<security_token>",
    "timestamp": "2023-07-15T10:30:00Z"
  }
  ```

### Get Tracking Dashboard Data

- **URL**: `/api/enhanced-tracking/dashboard/<tracking_id>`
- **Method**: `GET`

### Verify Checkpoint with Package Integrity

- **URL**: `/api/enhanced-tracking/verify-checkpoint`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "checkpointId": "<checkpoint_id>",
    "verificationCode": "<verification_code>",
    "packageScans": [
      {
        "packageId": "<package_id>",
        "status": "intact"
      }
    ]
  }
  ```

## 5. Checkpoint Verification (Part of Vehicle Tracking)

### Verify Checkpoint (Standard)

- **URL**: `/api/vehicle-tracking/verify-checkpoint`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "checkpointId": "<checkpoint_id>",
    "verificationCode": "<verification_code>"
  }
  ```

### Verify Checkpoint with Package Integrity (Enhanced)

- **URL**: `/api/enhanced-tracking/verify-checkpoint`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trackingId": "<tracking_id>",
    "checkpointId": "<checkpoint_id>",
    "verificationCode": "<verification_code>",
    "packageScans": [
      {
        "packageId": "<package_id>",
        "status": "intact"
      }
    ]
  }
  ```

## Testing Workflow

1. **Login** to get the authentication token
2. **Create a delivery** (if needed) using `/api/delivery` endpoints
3. **Initialize tracking** for the delivery
4. **Update vehicle location** periodically to simulate movement
5. **Verify checkpoints** as the vehicle passes through them
6. **Create and verify tamper-proof packaging** for the delivery
7. **Complete the delivery** with OTP verification

## Notes

- Replace placeholder values (`<delivery_id>`, `<tracking_id>`, etc.) with actual values from your system
- Ensure you have the correct permissions (admin, delivery_personnel, or pds_shop_owner) for each endpoint
- For testing purposes, you can create test data using the appropriate endpoints
- The enhanced tracking features provide more detailed information and better anomaly detection than the standard tracking