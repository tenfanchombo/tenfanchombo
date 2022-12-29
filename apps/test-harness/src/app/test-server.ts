import {
    createNewGameDocument,
    createMoveProxy,
    moveValidators
} from "@tenfanchombo/server-core";
import { GameDocument, GameService, PlayerIndex, PlayerInfo } from '@tenfanchombo/game-core';
import { Wind } from "@tenfanchombo/common";
import { TestFirebaseStore } from "./test-firebase-store";

export const DummyPlayerData: readonly PlayerInfo[] = [
    {
        name: 'Peter',
        id: 'test-p1',
        avatarUrl: '/assets/player-1.png',
        seatWind: Wind.East,
        points: 1000
    }, {
        name: 'Dummy K',
        id: 'test-p2',
        avatarUrl: '/assets/player-2.png',
        seatWind: Wind.North,
        points: 1000
    }, {
        name: 'Sharon',
        id: 'test-p3',
        avatarUrl: '/assets/player-3.png',
        seatWind: Wind.West,
        points: 1000
    }, {
        name: 'Berg',
        id: 'test-p4',
        avatarUrl: '/assets/player-4.png',
        seatWind: Wind.South,
        points: 1000
    }
];

export class TestServer {

    useTrainingWheels = true;
    private store = new TestFirebaseStore();

    async connect(players: readonly PlayerInfo[], gameId: string, playerIndex: PlayerIndex): Promise<GameService> {

        await this.store.insertIfDoesNotExist(gameId, createNewGameDocument(players));

        const playerId = players[playerIndex].id;
        const gameDocument$ = this.store.get$(gameId, playerId);
        const moveProxy = createMoveProxy(gameId, playerId, this.store);

        let latestDoc: GameDocument | undefined;
        gameDocument$.subscribe(d => latestDoc = d);

        const trainingProxy = new Proxy(moveProxy, {
            get: (target, prop, reciever) => {
                return (...args: unknown[]) => {
                    const valid = !this.useTrainingWheels || !latestDoc || (moveValidators as unknown as Record<string | symbol, (...args: unknown[]) => ReturnType<typeof moveValidators['rollDice']>>)[prop]
                        (latestDoc, playerIndex, ...args);
                    if (valid !== true) {
                        console.warn(valid)
                    } else {
                        return Reflect.get(target, prop, reciever)(...args);
                    }
                }
            }
        })

        return new GameService(gameId, playerIndex, players[playerIndex].id, gameDocument$, trainingProxy);
    }
}