import { Game } from '../../src';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../src/statics';

export interface ServerToClientEvents {
    initSuccess(): void;
    initFail(reason: 'invalidId' | 'other'): void;

    requestCancel(requestId: string): void;
    requestSuccess(requestId: string): void;
    requestFail(requestId: string, reason: 'invalidRequestId' | 'alreadyFinished' | 'other'): void;

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