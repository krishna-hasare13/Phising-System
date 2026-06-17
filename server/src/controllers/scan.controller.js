const ScanHistory = require('../models/ScanHistory');
const { scoreUrlByRules, scoreTextByRules } = require('../services/riskScoring');
const { forwardUrlToExternalApis } = require('./externalApi.controller');

const {
  normalizeBody,
  parseUrlAndValidate,
  truncateText,
  badRequest,
} = require('../middleware/validateInput');

function getUserId(req) {
  // req.user will be populated by requireAuth middleware
  return req.user?.id;
}

async function scanUrl(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const body = normalizeBody(req);
    const { url } = body;

    const safeUrl = parseUrlAndValidate(url);

    // External API calls (best-effort)
    const externalSignals = await forwardUrlToExternalApis(safeUrl).catch((e) => ({
      virustotal: { error: e?.message || String(e) },
      googleSafeBrowsing: { error: e?.message || String(e) },
    }));

    // Rule-based aggregation
    const scored = scoreUrlByRules(safeUrl, externalSignals);

    const history = await ScanHistory.create({
      userId,
      scanType: 'url',
      content: safeUrl,
      result: {
        riskPercentage: scored.riskPercentage,
        threatStatus: scored.threatStatus,
        recommendation: scored.recommendation,
      },
      flaggedKeywords: scored.flaggedKeywords,
    });

    res.status(201).json({
      message: 'URL scan completed',
      result: history.result,
      flaggedKeywords: history.flaggedKeywords,
    });
  } catch (err) {
    next(err);
  }
}

async function scanEmail(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const body = normalizeBody(req);
    const { content } = body;

    if (!content || typeof content !== 'string') {
      throw badRequest('Email content is required');
    }

    const safeContent = truncateText(content, 5000);

    // For email scanning, we don’t necessarily have a single URL to forward.
    // We can still parse URLs from content later; for now keep it best-effort.
    const externalSignals = await (async () => {
      const urlMatch = safeContent.match(/https?:\/\/[^\s]+/i);
      if (!urlMatch) return { googleSafeBrowsing: { matches: [] } };

      // Validate before sending to external providers
      const safeUrl = parseUrlAndValidate(urlMatch[0]);
      const forwarded = await forwardUrlToExternalApis(safeUrl).catch(() => null);
      return forwarded || { googleSafeBrowsing: { matches: [] } };
    })();

    const scored = scoreTextByRules(safeContent, 'email', externalSignals);

    const history = await ScanHistory.create({
      userId,
      scanType: 'email',
      content: safeContent,

      result: {
        riskPercentage: scored.riskPercentage,
        threatStatus: scored.threatStatus,
        recommendation: scored.recommendation,
      },
      flaggedKeywords: scored.flaggedKeywords,
    });

    res.status(201).json({
      message: 'Email scan completed',
      result: history.result,
      flaggedKeywords: history.flaggedKeywords,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyHistory(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const { scanType } = req.query || {};

    const query = { userId };

    if (scanType && (scanType === 'url' || scanType === 'email')) {
      query.scanType = scanType;
    }

    const history = await ScanHistory.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      message: 'Scan history fetched',
      scans: history,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyStats(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

    const all = await ScanHistory.find({ userId }).select('result.threatStatus');

    const totalScans = all.length;
    const safeCount = all.filter((s) => s?.result?.threatStatus === 'Safe').length;
    const suspiciousCount = all.filter((s) => s?.result?.threatStatus === 'Suspicious').length;
    const maliciousCount = all.filter((s) => s?.result?.threatStatus === 'Malicious').length;

    res.json({
      totalScans,
      safeCount,
      suspiciousCount,
      maliciousCount,
      safeRatio: totalScans ? (safeCount / totalScans) * 100 : 0,
      suspiciousRatio: totalScans ? (suspiciousCount / totalScans) * 100 : 0,
      maliciousRatio: totalScans ? (maliciousCount / totalScans) * 100 : 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  scanUrl,
  scanEmail,
  getMyHistory,
  getMyStats,
};
