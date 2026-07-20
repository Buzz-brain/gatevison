# GateVision API Reference

## Overview

GateVision uses a RESTful JSON API. Base URL: `/api/v1`

## Authentication

All endpoints except login require a Bearer JWT token.

### POST /auth/login
```json
// Request
{ "email": "admin@gatevision.ai", "password": "admin123" }
// Response
{ "access_token": "...", "refresh_token": "...", "user": { ... } }
```

### POST /auth/refresh
```json
// Request
{ "refresh_token": "..." }
// Response
{ "access_token": "...", "refresh_token": "..." }
```

### GET /auth/me
Returns current user profile.

## Recognition Pipeline

### POST /pipeline/process/upload
Upload an image for full recognition pipeline processing.

### GET /pipeline/status/{id}
Poll pipeline status by ID.

### GET /pipeline/metrics
Get pipeline performance metrics.

## Identity Management

### GET /identity/drivers
List all drivers with optional search/filter.

### POST /identity/drivers
Create a new driver profile.

### GET /identity/vehicles
List all vehicles.

### POST /identity/enroll/driver
Enroll a new driver with biometric data.

### GET /identity/relationships
Get relationship graph data.

## Gate Operations

### GET /gate/active
List active gate sessions (poll at 5s intervals).

### POST /gate/entry
Process a vehicle entry request.

### POST /gate/exit
Process a vehicle exit request.

### GET /gate/transactions
Get gate transaction history.

## System

### GET /system/health
Overall system health status.

### GET /system/models
AI model health and status.

### GET /system/performance
System performance metrics.

### GET /system/storage-info
Storage utilization information.

## Reports

### GET /admin/dashboard
Dashboard metrics and analytics.

### GET /admin/reports
Historical report records.

### GET /admin/analytics
Analytics summary data.

## Administration

### GET /admin/manual-reviews
Manual review queue.

### POST /admin/manual-review/{id}/approve
Approve a manual review.

### POST /admin/manual-review/{id}/reject
Reject a manual review.

## Response Format

### Success
```json
{ "status": "ok", "data": { ... } }
```

### Error
```json
{ "status": "error", "detail": "Error message" }
```

## Error Codes

| Code | Description |
|------|-------------|
| INVALID_CREDENTIALS | Wrong email or password |
| SESSION_EXPIRED | JWT token expired |
| UNAUTHORIZED | Missing or invalid token |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Invalid request data |
| SERVER_ERROR | Internal server error |
| NETWORK_ERROR | Backend unreachable |
| OFFLINE | No internet connection |
