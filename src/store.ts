import { Repository } from 'typeorm';
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
     * Session TTL in seconds. Defaults to 86400 (1 day)
     */
    ttl?: number;
}

export class TypeormStore extends Store {
    private readonly repository: Repository<SessionEntity>;
    private readonly ttl: number | undefined;

    constructor (options: Options) {
        super(options);

        if (!options.repository) {
            throw new Error('The repository option is required');
        }

        this.repository = options.repository;
        this.ttl = options.ttl;
    }

    /**
     * Get all sessions.
     * @param {(error: any, result?: any) => void} callback
     */
    public all = (callback: (error: any, result?: any) => void): void => {
        this.repository.find()
            .then((sessions: SessionEntity[]) => sessions.map(session => JSON.parse(session.data)))
            .then((data: any) => callback(null, data))
            .catch((error: any) => callback(error));
    }

    /**
     * Destroy a session
     * @param {string} id
     * @param {(error: any) => void} callback
     */
    public destroy = (id: string, callback: (error: any) => void): void => {
        this.repository.delete(id)
            .then(() => callback(null))
            .catch((error: any) => callback(error));
    }

    /**
     * Clear all sessions.
     * @param {(error: any) => void} callback
     */
    public clear = (callback: (error: any) => void): void => {
        this.repository.clear()
            .then(() => callback(null))
            .catch((error: any) => callback(error));
    }

    /**
     * Get the session count.
     * @param {(error: any, length?: number) => void} callback
     */
    public length = (callback: (error: any, length: number) => void): void => {
        this.repository.count()
            .then((length: number) => callback(null, length))
            .catch((error: any) => callback(error, 0));
    }

    /**
     * Get a session.
     * @param {string} id
     * @param {(error: any, session?: any) => any} callback
     */
    public get = (id: string, callback: (error: any, session?: any) => void): void => {
        this.repository.findOne(id)
            .then((session: SessionEntity | undefined) => {
                if (!session) {
                    return callback(null);
                }
                const data = JSON.parse(session.data);
                callback(null, data);
            })
            .catch((error: any) => callback(error));
    }

    /**
     * Set a session.
     * @param {string} id
     * @param session
     * @param {(error: any) => void} callback
     */
    public set = (id: string, session: any, callback: (error: any) => void): void => {
        let data;
        try {
            data = JSON.stringify(session);
        } catch (error) {
            return callback(error);
        }

        const ttl = this.getTTL(session);
        const expiresAt = Math.floor(new Date().getTime() / 1000) + ttl;

        this.repository.save({ id, data, expiresAt })
            .then(() => callback(null))
            .catch((error: any) => callback(error));
    }

    /**
     * Refresh the session expiry time.
     * @param {string} id
     * @param session
     * @param {(error: any) => void} callback
     */
    public touch = (id: string, session: any, callback: (error: any) => void): void => {
        const ttl = this.getTTL(session);
        const expiresAt = Math.floor(new Date().getTime() / 1000) + ttl;

        this.repository.update(id, { expiresAt })
            .then(() => callback(null))
            .catch((error: any) => callback(error));
    }

    /**
     * Get the session TTL (time to live) in seconds.
     * @param session
     * @return {number}
     */
    private getTTL (session: any): number {
        if (this.ttl) {
            return this.ttl;
        }
        return session.cookie && session.cookie.maxAge
            ? Math.floor(session.cookie.maxAge / 1000)
            : 86400;
    }
}
