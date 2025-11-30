# IoT Device - Raspberry Pi Attendance Scanner

This folder contains the legacy RFID-based scanner code. 

## ⚠️ Important Note

The production IoT system has been moved to a separate repository with advanced features:

**Main IoT Repository:** https://github.com/Cerjho/IoT-Attendance-System

## Features of Production IoT System

- ✅ Face recognition with quality validation
- ✅ QR code scanning
- ✅ Offline capability with local SQLite cache
- ✅ Cloud sync to Supabase
- ✅ SMS notifications to parents
- ✅ Auto-capture with stability checks
- ✅ Production-ready monitoring

## Integration with Web System

The IoT device writes attendance records to the `entrance_logs` table in Supabase, which is then displayed in:
- Admin Dashboard - Full attendance reports
- Teacher Portal - Class-specific attendance
- Student Portal - Personal attendance history

## Database Connection

Both systems share the same Supabase database:
- **Students** - Synced daily to IoT device
- **Entrance Logs** - Written by IoT device, read by web app
- **SMS Notifications** - Triggered by IoT device

## Setup Instructions

For current IoT device setup, refer to:
https://github.com/Cerjho/IoT-Attendance-System/blob/main/README.md

## Legacy Code

The `raspberry_pi_scanner.py` file in this folder is kept for reference but is not actively used in production.
