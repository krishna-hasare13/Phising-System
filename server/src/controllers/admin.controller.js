const User = require('../models/User');
const ScanHistory = require('../models/ScanHistory');
const Report = require('../models/Report');

/**
 * Get all users with pagination and filtering
 */
async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    res.json({
      message: 'Users fetched successfully',
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID
 */
async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User fetched successfully',
      user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user role
 */
async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user
 */
async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Also delete user's scan history
    await ScanHistory.deleteMany({ userId });
    
    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system-wide analytics
 */
async function getSystemAnalytics(req, res, next) {
  try {
    const [totalUsers, totalScans, totalReports] = await Promise.all([
      User.countDocuments(),
      ScanHistory.countDocuments(),
      Report.countDocuments()
    ]);
    
    // Get scan statistics
    const scans = await ScanHistory.find().select('result.threatStatus scanType createdAt');
    
    const safeCount = scans.filter(s => s.result.threatStatus === 'Safe').length;
    const suspiciousCount = scans.filter(s => s.result.threatStatus === 'Suspicious').length;
    const maliciousCount = scans.filter(s => s.result.threatStatus === 'Malicious').length;
    
    const urlScans = scans.filter(s => s.scanType === 'url').length;
    const emailScans = scans.filter(s => s.scanType === 'email').length;
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentScans = await ScanHistory.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get report status breakdown
    const reports = await Report.find().select('status');
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const reviewedReports = reports.filter(r => r.status === 'reviewed').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    
    res.json({
      message: 'System analytics fetched successfully',
      analytics: {
        users: {
          total: totalUsers,
          recent: recentUsers
        },
        scans: {
          total: totalScans,
          recent: recentScans,
          safe: safeCount,
          suspicious: suspiciousCount,
          malicious: maliciousCount,
          urlScans,
          emailScans,
          safeRatio: totalScans ? (safeCount / totalScans) * 100 : 0,
          suspiciousRatio: totalScans ? (suspiciousCount / totalScans) * 100 : 0,
          maliciousRatio: totalScans ? (maliciousCount / totalScans) * 100 : 0
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          reviewed: reviewedReports,
          resolved: resolvedReports
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all detection logs (system-wide scan history)
 */
async function getAllDetectionLogs(req, res, next) {
  try {
    const { page = 1, limit = 20, scanType = '', status = '' } = req.query;
    
    const query = {};
    
    if (scanType && ['url', 'email'].includes(scanType)) {
      query.scanType = scanType;
    }
    
    if (status && ['Safe', 'Suspicious', 'Malicious'].includes(status)) {
      query['result.threatStatus'] = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      ScanHistory.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ScanHistory.countDocuments(query)
    ]);
    
    res.json({
      message: 'Detection logs fetched successfully',
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all reports
 */
async function getAllReports(req, res, next) {
  try {
    const { page = 1, limit = 20, status = '', reportType = '' } = req.query;
    
    const query = {};
    
    if (status && ['pending', 'reviewed', 'resolved'].includes(status)) {
      query.status = status;
    }
    
    if (reportType && ['url', 'email', 'system'].includes(reportType)) {
      query.reportType = reportType;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(query)
    ]);
    
    res.json({
      message: 'Reports fetched successfully',
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update report status
 */
async function updateReportStatus(req, res, next) {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new report (for users to report suspicious content)
 */
async function createReport(req, res, next) {
  try {
    const { reportType, details } = req.body;
    const userId = req.user.id;
    
    if (!['url', 'email', 'system'].includes(reportType)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }
    
    if (!details || typeof details !== 'object') {
      return res.status(400).json({ message: 'Report details are required' });
    }
    
    const report = await Report.create({
      reportType,
      details,
      userId,
      status: 'pending'
    });
    
    res.status(201).json({
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's own reports
 */
async function getUserReports(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reports, total] = await Promise.all([
      Report.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments({ userId })
    ]);
    
    res.json({
      message: 'User reports fetched successfully',
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getSystemAnalytics,
  getAllDetectionLogs,
  getAllReports,
  updateReportStatus,
  createReport,
  getUserReports
};
