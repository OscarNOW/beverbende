import { Game } from '../../src';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../src/statics';

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
    performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
        requestId: string,
        drawnCard: drawnCard, //todo: test if this can be sent using ws
        canDisposeValueCard: canDisposeValueCard,
        activePlayer: activePlayer, //todo: test if this can be sent using ws
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game //todo: test if this can be sent using ws
    ): void;

    declareLastRound<activePlayer extends ActivePlayer>(
        requestId: string,
        activePlayer: activePlayer, //todo: test if this can be sent using ws
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game //todo: test if this can be sent using ws
    ): void;

    acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
        requestId: string,
        drawnCard: drawnCard, //todo: test if this can be sent using ws
        activePlayer: activePlayer, //todo: test if this can be sent using ws
        currentAction: action<activePlayer, ActionCard<'extraDraw'>, true, 'current'>, //todo: test if this can be sent using ws
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game //todo: test if this can be sent using ws
    ): void;
}

export interface ClientToServerEvents {
    init(id: string): void;

    //todo: merge these decision functions into 1 request function
    performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
        requestId: string,
        value: action<activePlayer, drawnCard, canDisposeValueCard, 'new'>
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