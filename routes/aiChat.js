// routes/aiChat.js
const express = require('express');
const router = express.Router();
const aiChatService = require('../services/aiChatService');

/*
 * IMPORTANT: Make sure your main app.js has these middleware configured:
 * 
 * app.use(express.json({ limit: '10mb' }));
 * app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 * 
 * Without these, req.body will be undefined and cause errors.
 */

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map();
const sessionStore = new Map(); // Store chat sessions
const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // max 10 requests per minute per user
};

// Rate limiting middleware
const rateLimit = (req, res, next) => {
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    
    // Clean old entries
    const userRequests = rateLimitStore.get(identifier) || [];
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= RATE_LIMIT.maxRequests) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            reply: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút rồi thử lại.',
            retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
        });
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitStore.set(identifier, validRequests);
    
    next();
};

// Input validation middleware - ROBUST VERSION
const validateChatInput = (req, res, next) => {
    // Debug logging but don't fail on it
    console.log('[DEBUG] Content-Type:', req.get('Content-Type'));
    console.log('[DEBUG] Raw body exists:', !!req.body);
    console.log('[DEBUG] Body type:', typeof req.body);
    
    // Handle case where body parser failed
    if (!req.body) {
        console.log('[DEBUG] Body is null/undefined - body parser may not be configured');
        return res.status(400).json({
            success: false,
            error: 'Request body missing',
            reply: 'Không nhận được dữ liệu. Vui lòng đảm bảo Content-Type là application/json.',
            debug: {
                contentType: req.get('Content-Type'),
                bodyExists: !!req.body,
                method: req.method
            }
        });
    }

    // Handle case where body is not an object (string, etc.)
    if (typeof req.body !== 'object') {
        console.log('[DEBUG] Body is not an object:', typeof req.body);
        return res.status(400).json({
            success: false,
            error: 'Invalid request body format',
            reply: 'Định dạng dữ liệu không hợp lệ. Vui lòng gửi JSON object.',
            debug: {
                bodyType: typeof req.body,
                bodyValue: req.body
            }
        });
    }

    // Now safely get the message
    const message = req.body.message;
    console.log('[DEBUG] Extracted message:', message);
    
    if (message === undefined || message === null) {
        console.log('[DEBUG] Message field is missing');
        return res.status(400).json({
            success: false,
            error: 'Message is required',
            reply: 'Vui lòng nhập tin nhắn để tôi có thể hỗ trợ bạn.',
            debug: {
                bodyKeys: Object.keys(req.body),
                messageValue: message
            }
        });
    }
    
    if (typeof message !== 'string') {
        console.log('[DEBUG] Message is not a string:', typeof message);
        return res.status(400).json({
            success: false,
            error: 'Message must be a string',
            reply: 'Tin nhắn phải là chuỗi ký tự.',
            debug: {
                messageType: typeof message,
                messageValue: message
            }
        });
    }
    
    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length === 0) {
        console.log('[DEBUG] Message is empty after trim');
        return res.status(400).json({
            success: false,
            error: 'Message cannot be empty',
            reply: 'Tin nhắn không thể để trống.'
        });
    }
    
    if (trimmedMessage.length > 1000) {
        console.log('[DEBUG] Message too long:', trimmedMessage.length);
        return res.status(400).json({
            success: false,
            error: 'Message too long',
            reply: 'Tin nhắn quá dài. Vui lòng rút gọn dưới 1000 ký tự.'
        });
    }
    
    // Add cleaned message to request
    req.cleanedMessage = trimmedMessage;
    console.log('[DEBUG] Validation passed for message:', trimmedMessage.substring(0, 50) + '...');
    next();
};

// Session management middleware - SAFE VERSION
const manageSession = (req, res, next) => {
    // Ensure req.body exists
    if (!req.body || typeof req.body !== 'object') {
        req.body = {}; // Initialize empty body if needed
    }
    
    const sessionId = req.body.sessionId;
    const userId = req.user ? req.user._id.toString() : req.ip;
    
    // Generate session ID if not provided
    let finalSessionId = sessionId;
    if (!finalSessionId) {
        finalSessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Get or create chat session (different from Express session)
    if (!sessionStore.has(finalSessionId)) {
        sessionStore.set(finalSessionId, {
            id: finalSessionId,
            userId: userId,
            createdAt: new Date(),
            lastActivity: new Date(),
            messages: [],
            context: {}
        });
    } else {
        // Update last activity
        const chatSession = sessionStore.get(finalSessionId);
        chatSession.lastActivity = new Date();
        sessionStore.set(finalSessionId, chatSession);
    }
    
    req.sessionId = finalSessionId;
    req.chatSession = sessionStore.get(finalSessionId); // Use different property name
    next();
};

// Logging middleware
const logChatRequest = (req, res, next) => {
    const userId = req.user ? req.user._id : 'anonymous';
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    
    console.log(`[AI Chat] ${new Date().toISOString()} - User: ${userId} - IP: ${ip} - Session: ${req.sessionId} - Message: "${req.cleanedMessage.substring(0, 50)}..."`);
    
    next();
};

/**
 * @route POST /api/ai/debug
 * @desc Debug endpoint to check body parsing
 * @access Public
 */
router.post('/debug', (req, res) => {
    console.log('[DEBUG ENDPOINT] Headers:', req.headers);
    console.log('[DEBUG ENDPOINT] Body:', req.body);
    console.log('[DEBUG ENDPOINT] Raw body type:', typeof req.body);
    console.log('[DEBUG ENDPOINT] Content-Type:', req.get('Content-Type'));
    
    res.json({
        success: true,
        debug: {
            headers: req.headers,
            body: req.body,
            bodyType: typeof req.body,
            contentType: req.get('Content-Type'),
            bodyExists: !!req.body,
            bodyKeys: req.body ? Object.keys(req.body) : [],
            method: req.method,
            url: req.url
        }
    });
});

/**
 * @route POST /api/ai/chat
 * @desc Send message to AI assistant
 * @access Public
 */
router.post('/chat', rateLimit, validateChatInput, manageSession, logChatRequest, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const message = req.cleanedMessage;
        const sessionId = req.sessionId;
        const chatSession = req.chatSession; // Use chatSession instead of session
        const userId = req.user ? req.user._id : null;
        
        // Add message to session history
        chatSession.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        
        // Keep only last 10 messages for context
        if (chatSession.messages.length > 20) {
            chatSession.messages = chatSession.messages.slice(-20);
        }
        
        // Generate AI response with session context and user info
        let aiResponse;
        try {
            // Pass userId to the AI service for personalized responses
            aiResponse = await aiChatService.generateResponse(message, userId, sessionId, chatSession);
        } catch (aiError) {
            console.log(`[AI Fallback] AI service failed, using fallback response for: "${message}"`);
            // Use fallback response from aiChatService
            aiResponse = await aiChatService.getFallbackResponse(message);
        }
        
        // Add AI response to session history
        chatSession.messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });
        
        // Update session in store
        sessionStore.set(sessionId, chatSession);
        
        const responseTime = Date.now() - startTime;
        
        // Log successful response
        console.log(`[AI Chat Success] Session: ${sessionId} - Response time: ${responseTime}ms`);
        console.log(`[AI Chat Success] Response: "${aiResponse.substring(0, 100)}..."`);
        
        // Send response
        res.json({
            success: true,
            reply: aiResponse,
            timestamp: new Date().toISOString(),
            responseTime: responseTime,
            sessionId: sessionId,
            messageCount: chatSession.messages.length
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        console.error(`[AI Chat Error] ${error.message}`);
        console.error(`[AI Chat Error] Response time: ${responseTime}ms`);
        console.error(`[AI Chat Error] Stack:`, error.stack);
        
        // Determine error type and provide appropriate response
        let errorResponse = {
            success: false,
            error: 'AI service temporarily unavailable',
            reply: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ nhân viên hỗ trợ.',
            timestamp: new Date().toISOString(),
            responseTime: responseTime,
            sessionId: req.sessionId
        };
        
        // Customize error message based on error type
        if (error.code === 'ECONNREFUSED') {
            errorResponse.reply = 'Hệ thống AI tạm thời không khả dụng. Vui lòng liên hệ nhân viên qua hotline để được hỗ trợ ngay.';
            errorResponse.error = 'AI service connection refused';
        } else if (error.code === 'ETIMEDOUT') {
            errorResponse.reply = 'Hệ thống đang xử lý chậm. Vui lòng thử lại sau ít phút.';
            errorResponse.error = 'AI service timeout';
        } else if (error.message.includes('Rate limit')) {
            errorResponse.reply = 'Bạn đã gửi tin nhắn quá nhanh. Vui lòng chờ một chút rồi thử lại.';
            errorResponse.error = 'Rate limit exceeded';
        }
        
        res.status(500).json(errorResponse);
    }
});

/**
 * @route GET /api/ai/chat/session/:sessionId
 * @desc Get chat session history
 * @access Public
 */
router.get('/chat/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        if (!sessionStore.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
                message: 'Phiên chat không tồn tại hoặc đã hết hạn.'
            });
        }
        
        const session = sessionStore.get(sessionId);
        const userId = req.user ? req.user._id.toString() : req.ip;
        
        // Check if user owns this session
        if (session.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'Bạn không có quyền truy cập phiên chat này.'
            });
        }
        
        const startIndex = Math.max(0, session.messages.length - offset - limit);
        const endIndex = session.messages.length - offset;
        const messages = session.messages.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            session: {
                id: session.id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                messageCount: session.messages.length
            },
            messages: messages,
            pagination: {
                total: session.messages.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: startIndex > 0
            }
        });
        
    } catch (error) {
        console.error('[Session Retrieval Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve session',
            message: 'Không thể tải lịch sử chat.'
        });
    }
});

/**
 * @route DELETE /api/ai/chat/session/:sessionId
 * @desc Clear chat session
 * @access Public
 */
router.delete('/chat/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionStore.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
                message: 'Phiên chat không tồn tại.'
            });
        }
        
        const session = sessionStore.get(sessionId);
        const userId = req.user ? req.user._id.toString() : req.ip;
        
        // Check if user owns this session
        if (session.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'Bạn không có quyền xóa phiên chat này.'
            });
        }
        
        sessionStore.delete(sessionId);
        
        console.log(`[Session Cleared] SessionId: ${sessionId} - User: ${userId}`);
        
        res.json({
            success: true,
            message: 'Đã xóa lịch sử chat thành công.'
        });
        
    } catch (error) {
        console.error('[Session Deletion Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to clear session',
            message: 'Không thể xóa lịch sử chat.'
        });
    }
});

/**
 * @route GET /api/ai/chat/sessions
 * @desc Get user's chat sessions
 * @access Public
 */
router.get('/chat/sessions', async (req, res) => {
    try {
        const userId = req.user ? req.user._id.toString() : req.ip;
        const { limit = 10, offset = 0 } = req.query;
        
        // Get all sessions for this user
        const userSessions = Array.from(sessionStore.values())
            .filter(session => session.userId === userId)
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
            .slice(offset, offset + parseInt(limit));
        
        const totalSessions = Array.from(sessionStore.values())
            .filter(session => session.userId === userId).length;
        
        const sessions = userSessions.map(session => ({
            id: session.id,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            messageCount: session.messages.length,
            lastMessage: session.messages.length > 0 ? 
                session.messages[session.messages.length - 1].content.substring(0, 100) + '...' : 
                null
        }));
        
        res.json({
            success: true,
            sessions: sessions,
            pagination: {
                total: totalSessions,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < totalSessions
            }
        });
        
    } catch (error) {
        console.error('[Sessions List Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve sessions',
            message: 'Không thể tải danh sách phiên chat.'
        });
    }
});

/**
 * @route POST /api/ai/chat/feedback
 * @desc Submit feedback for AI response
 * @access Public
 */
router.post('/chat/feedback', async (req, res) => {
    try {
        // Safe body access
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                message: 'Dữ liệu phản hồi không hợp lệ.'
            });
        }

        const sessionId = req.body.sessionId;
        const messageIndex = req.body.messageIndex;
        const rating = req.body.rating;
        const comment = req.body.comment;
        
        if (!sessionId || messageIndex === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and message index are required',
                message: 'Thông tin phản hồi không đầy đủ.'
            });
        }
        
        if (!sessionStore.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
                message: 'Phiên chat không tồn tại.'
            });
        }
        
        const session = sessionStore.get(sessionId);
        const userId = req.user ? req.user._id.toString() : req.ip;
        
        // Check if user owns this session
        if (session.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // Validate message index
        if (messageIndex < 0 || messageIndex >= session.messages.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid message index'
            });
        }
        
        // Add feedback to message
        if (!session.messages[messageIndex].feedback) {
            session.messages[messageIndex].feedback = {};
        }
        
        session.messages[messageIndex].feedback = {
            rating: rating,
            comment: comment,
            submittedAt: new Date(),
            userId: userId
        };
        
        sessionStore.set(sessionId, session);
        
        console.log(`[Feedback Submitted] Session: ${sessionId} - Message: ${messageIndex} - Rating: ${rating}`);
        
        res.json({
            success: true,
            message: 'Cảm ơn bạn đã gửi phản hồi!'
        });
        
    } catch (error) {
        console.error('[Feedback Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback',
            message: 'Không thể gửi phản hồi.'
        });
    }
});

/**
 * @route GET /api/ai/chat/health
 * @desc Check AI service health
 * @access Public
 */
router.get('/chat/health', async (req, res) => {
    try {
        console.log('[AI Health Check] Checking AI service status...');
        
        const healthStatus = await aiChatService.checkHealth();
        
        console.log('[AI Health Check] Status:', healthStatus.status);
        
        if (healthStatus.status === 'healthy') {
            res.json({
                status: 'healthy',
                message: 'AI service is operational',
                model: healthStatus.model,
                version: healthStatus.version,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                activeSessions: sessionStore.size,
                rateLimitUsers: rateLimitStore.size
            });
        } else {
            res.status(503).json({
                status: 'unhealthy',
                message: 'AI service is not available',
                error: healthStatus.error,
                model: healthStatus.model,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('[AI Health Check Error]', error.message);
        
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/ai/chat/stats
 * @desc Get AI chat statistics (admin only)
 * @access Private/Admin
 */
router.get('/chat/stats', async (req, res) => {
    try {
        // You can add admin authentication middleware here
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ error: 'Access denied' });
        // }
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        // Calculate session statistics
        const allSessions = Array.from(sessionStore.values());
        const activeSessions = allSessions.filter(s => new Date(s.lastActivity) > oneDayAgo);
        const recentSessions = allSessions.filter(s => new Date(s.lastActivity) > oneHourAgo);
        
        // Calculate message statistics
        const totalMessages = allSessions.reduce((sum, session) => sum + session.messages.length, 0);
        const todayMessages = allSessions.reduce((sum, session) => {
            return sum + session.messages.filter(m => new Date(m.timestamp) > oneDayAgo).length;
        }, 0);
        
        const stats = {
            sessions: {
                total: sessionStore.size,
                active24h: activeSessions.length,
                active1h: recentSessions.length
            },
            messages: {
                total: totalMessages,
                today: todayMessages,
                averagePerSession: sessionStore.size > 0 ? (totalMessages / sessionStore.size).toFixed(2) : 0
            },
            rateLimit: {
                activeUsers: rateLimitStore.size,
                requests: Object.fromEntries(rateLimitStore)
            },
            system: {
                serverUptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version
            },
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            stats: stats
        });
        
    } catch (error) {
        console.error('[AI Stats Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
});

/**
 * @route POST /api/ai/chat/reset
 * @desc Reset AI chat service (admin only)
 * @access Private/Admin
 */
router.post('/chat/reset', async (req, res) => {
    try {
        // Add admin authentication here
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ error: 'Access denied' });
        // }
        
        // Safe body access
        const clearSessions = req.body && req.body.clearSessions === true;
        const clearRateLimit = req.body && req.body.clearRateLimit === true;
        
        let resetActions = [];
        
        if (clearSessions) {
            const sessionCount = sessionStore.size;
            sessionStore.clear();
            resetActions.push(`Cleared ${sessionCount} sessions`);
        }
        
        if (clearRateLimit) {
            const rateLimitCount = rateLimitStore.size;
            rateLimitStore.clear();
            resetActions.push(`Cleared ${rateLimitCount} rate limit entries`);
        }
        
        console.log(`[AI Service Reset] Actions: ${resetActions.join(', ')}`);
        
        res.json({
            success: true,
            message: 'AI service reset completed',
            actions: resetActions,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI Reset Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to reset AI service'
        });
    }
});

// Cleanup old sessions periodically
setInterval(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [sessionId, session] of sessionStore.entries()) {
        if (new Date(session.lastActivity) < oneWeekAgo) {
            sessionStore.delete(sessionId);
            console.log(`[Session Cleanup] Removed old session: ${sessionId}`);
        }
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;