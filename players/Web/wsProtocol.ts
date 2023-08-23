export const requestTypes = ['performAction', 'declareLastRound', 'acceptExtraDrawCard'] as const;
export type requestType = typeof requestTypes[number];
export type request = {
    type: requestType,
    requestId: string,
    finished: boolean,
    args: unknown[]
};

export interface ServerToClientEvents {
    initSuccess(activePlayer: string): void;
    initFail(reason: 'invalidId' | 'other'): void;

    request(requestId: string, type: requestType, args: string): void;

    requestCancel(requestId: string): void;
    requestSuccess(requestId: string): void;
    requestFail(requestId: string, reason: 'invalidRequestId' | 'requestCanceled' | 'other'): void;
}

export interface ClientToServerEvents {
    init(id: string): void;
    request(requestId: string, type: requestType, value: string): void;
}

export interface InterServerEvents { }

export interface SocketData { }