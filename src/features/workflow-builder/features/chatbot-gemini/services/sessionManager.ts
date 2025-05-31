interface SessionState {
  probingAttemptCount: number;
  lastIntent?: string;
  lastEntities?: Record<string, any>;
  lastMessage?: string;
  createdAt: Date;
  lastActivity: Date;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, SessionState>;
  private readonly MAX_PROBING_ATTEMPTS = 3;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.sessions = new Map();
    this.startCleanupInterval();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private startCleanupInterval() {
    setInterval(() => this.cleanupSessions(), 5 * 60 * 1000); // Clean up every 5 minutes
  }

  private cleanupSessions() {
    const now = new Date();
    for (const [sessionId, state] of this.sessions.entries()) {
      if (now.getTime() - state.lastActivity.getTime() > this.SESSION_TIMEOUT_MS) {
        this.sessions.delete(sessionId);
        console.log(`[SESSION] Cleaned up expired session: ${sessionId}`);
      }
    }
  }

  public getSession(sessionId: string): SessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        probingAttemptCount: 0,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  public incrementProbingAttempts(sessionId: string): number {
    const session = this.getSession(sessionId);
    session.probingAttemptCount++;
    session.lastActivity = new Date();
    return session.probingAttemptCount;
  }

  public resetProbingAttempts(sessionId: string): void {
    const session = this.getSession(sessionId);
    session.probingAttemptCount = 0;
    session.lastActivity = new Date();
  }

  public updateSessionState(sessionId: string, update: Partial<SessionState>): void {
    const session = this.getSession(sessionId);
    Object.assign(session, update);
    session.lastActivity = new Date();
  }

  public hasReachedMaxProbingAttempts(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    return session.probingAttemptCount >= this.MAX_PROBING_ATTEMPTS;
  }

  public getSessionInfo(sessionId: string): SessionState {
    return this.getSession(sessionId);
  }
}