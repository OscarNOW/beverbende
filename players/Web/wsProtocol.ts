export const requestTypes = ['performAction', 'declareLastRound', 'acceptExtraDrawCard'] as const;
export type requestType = typeof requestTypes[number];
export type request = {
    type: requestType,
    requestId: string,
    finished: boolean,
    args: unknown[]
};

export interface ServerToClientEvents {
    initSuccess(): void;
    initFail(reason: 'invalidId' | 'other'): void;

    requestCancel(requestId: string): void;
    requestSuccess(requestId: string): void;
    requestFail(requestId: string, reason: 'invalidRequestId' | 'requestCanceled' | 'other'): void;

    //todo: merge these decision functions into 1 request function
    performAction(
        requestId: string,
        drawnCard: string,
        canDisposeValueCard: string,
        activePlayer: string,
        privateInformation: string,
        game: string
    ): void;

    declareLastRound(
        requestId: string,
        activePlayer: string,
        privateInformation: string,
        game: string
    ): void;

    acceptExtraDrawCard(
        requestId: string,
        drawnCard: string,
        activePlayer: string,
        currentAction: string,
        privateInformation: string,
        game: string
    ): void;
}

export interface ClientToServerEvents {
    init(id: string): void;

    //todo: merge these decision functions into 1 request function
    performAction(
        requestId: string,
        value: string
    ): void;

    declareLastRound(
        requestId: string,
        value: boolean
    ): void;

    acceptExtraDrawCard(
        requestId: string,
        value: boolean
    ): void;
}

export interface InterServerEvents { }

export interface SocketData { }