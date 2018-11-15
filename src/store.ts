import { LessThan, Repository } from 'typeorm';
import { Store } from 'express-session';

export interface SessionEntity {
  /**
   * The randomly generated session ID.
   */
  id: string;

  /**
   * The UNIX timestamp at which the session will expire.
   */
  expiresAt: number;

  /**
   * The JSON data of the session.
   */
  data: string;
}

export interface Options {
  repository: Repository<SessionEntity>;

  /**
   * Session TTL in seconds. Defaults to 86400 (1 day).
   */
  ttl?: number;

  /**
   * Whether to remove expired sessions from the database. Defaults to true.
   */
  clearExpired?: boolean;

  /**
   * The interval between checking for expired sessions in seconds. Defaults to 86400 (1 day).
   */
  expirationInterval?: number;
}

export class TypeormStore extends Store {
  private readonly repository: Repository<SessionEntity>;
  private readonly ttl?: number;
  private readonly expirationInterval: number;
  private expirationIntervalId?: number;

  constructor(options: Options) {
    super(options);

    if (!options.repository) {
      throw new Error('The repository option is required');
    }

    this.repository = options.repository;
    this.ttl = options.ttl;
    this.expirationInterval = options.expirationInterval || 86400;

    if (options.clearExpired) {
      this.setExpirationInterval(this.expirationInterval);
    }
  }

  /**
   * Get all sessions.
   * @param {(error: any, result?: any) => void} callback
   */
  all = (callback: (error: any, result?: any) => void): void => {
    this.repository
      .find()
      .then((sessions: SessionEntity[]) => sessions.map(session => JSON.parse(session.data)))
      .then((data: any) => callback(null, data))
      .catch((error: any) => callback(error));
  };

  /**
   * Destroy a session
   * @param {string} id
   * @param {(error: any) => void} callback
   */
  destroy = (id: string, callback?: ((error: any) => void)): void => {
    this.repository
      .delete(id)
      .then(() => callback && callback(null))
      .catch((error: any) => callback && callback(error));
  };

  /**
   * Clear all sessions.
   * @param {(error: any) => void} callback
   */
  clear = (callback?: ((error: any) => void)): void => {
    this.repository
      .clear()
      .then(() => callback && callback(null))
      .catch((error: any) => callback && callback(error));
  };

  /**
   * Get the session count.
   * @param {(error: any, length?: number) => void} callback
   */
  length = (callback: (error: any, length: number) => void): void => {
    this.repository
      .count()
      .then((length: number) => callback(null, length))
      .catch((error: any) => callback(error, 0));
  };

  /**
   * Get a session.
   * @param {string} id
   * @param {(error: any, session?: any) => any} callback
   */
  get = (id: string, callback: (error: any, session?: any) => void): void => {
    this.repository
      .findOne(id)
      .then((session: SessionEntity | undefined) => {
        if (!session) {
          return callback(null);
        }
        const data = JSON.parse(session.data);
        callback(null, data);
      })
      .catch((error: any) => callback(error));
  };

  /**
   * Set a session.
   * @param {string} id
   * @param session
   * @param {(error: any) => void} callback
   */
  set = (id: string, session: any, callback?: ((error: any) => void)): void => {
    let data;
    try {
      data = JSON.stringify(session);
    } catch (error) {
      if (callback) {
        return callback(error);
      }
      throw error;
    }

    const ttl = this.getTTL(session);
    const expiresAt = Math.floor(new Date().getTime() / 1000) + ttl;

    this.repository
      .save({ id, data, expiresAt })
      .then(() => callback && callback(null))
      .catch((error: any) => callback && callback(error));
  };

  /**
   * Refresh the session expiry time.
   * @param {string} id
   * @param session
   * @param {(error: any) => void} callback
   */
  touch = (id: string, session: any, callback?: ((error: any) => void)): void => {
    const ttl = this.getTTL(session);
    const expiresAt = Math.floor(new Date().getTime() / 1000) + ttl;

    this.repository
      .update(id, { expiresAt })
      .then(() => callback && callback(null))
      .catch((error: any) => callback && callback(error));
  };

  /**
   * Remove all expired sessions from the database.
   * @param {(error: any) => void} callback
   */
  clearExpiredSessions = (callback?: (error: any) => void) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    this.repository
      .delete({ expiresAt: LessThan(timestamp) })
      .then(() => callback && callback(null))
      .catch((error: any) => callback && callback(error));
  };

  /**
   * Set the expiration interval in seconds. If the interval in seconds is not set, it defaults to the store's expiration interval.
   * @param {number} interval
   */
  setExpirationInterval = (interval?: number) => {
    interval = interval || this.expirationInterval;

    this.clearExpirationInterval();
    this.expirationIntervalId = setInterval(this.clearExpiredSessions, interval);
  };

  /**
   * Clear the expiration interval if it exists.
   */
  clearExpirationInterval = () => {
    if (this.expirationIntervalId) {
      clearInterval(this.expirationIntervalId);
    }

    this.expirationIntervalId = undefined;
  };

  /**
   * Get the session TTL (time to live) in seconds.
   * @param session
   * @return {number}
   */
  private getTTL = (session: any): number => {
    if (this.ttl) {
      return this.ttl;
    }
    return session.cookie && session.cookie.maxAge
      ? Math.floor(session.cookie.maxAge / 1000)
      : 86400;
  };
}
