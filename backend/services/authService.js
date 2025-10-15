// Authentication Service
// Handles session tokens and cookie-based authentication

const crypto = require('crypto');

class AuthService {
  constructor() {
    // In-memory session store (in production, use Redis or database)
    this.sessions = new Map();
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Generate a secure session token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session
   */
  createSession(userId = 'user') {
    const token = this.generateToken();
    const expiresAt = Date.now() + this.sessionTimeout;
    
    this.sessions.set(token, {
      userId,
      createdAt: Date.now(),
      expiresAt
    });

    return token;
  }

  /**
   * Validate a session token
   */
  validateSession(token) {
    if (!token) {
      return false;
    }

    const session = this.sessions.get(token);
    
    if (!session) {
      return false;
    }

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Destroy a session
   */
  destroySession(token) {
    if (this.sessions.has(token)) {
      this.sessions.delete(token);
      return true;
    }
    return false;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        cleaned++;
      }
    }
  }

  /**
   * Get session count
   */
  getSessionCount() {
    return this.sessions.size;
  }
}

// Export singleton instance
const authService = new AuthService();

// Clean up expired sessions every hour
setInterval(() => {
  authService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

module.exports = authService;

