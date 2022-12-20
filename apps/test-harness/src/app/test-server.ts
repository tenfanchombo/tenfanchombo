import {
    InMemoryDocumentStore,
    createNewGameDocument,
    DocumentStore,
    createMoveProxy,
    moveValidators
} from "@tenfanchombo/server-core";
import { GameService, PlayerIndex, PlayerInfo } from '@tenfanchombo/game-core';
import { Wind } from "@tenfanchombo/common";

export class TestServer {
    constructor() {
        this.store = new InMemoryDocumentStore();
        this.gameId = this.store.create(createNewGameDocument(this.playerData));
    }

    useTrainingWheels = true;

    readonly gameId: string;
    private readonly playerData: readonly PlayerInfo[] = [
        {
            name: 'Player 1',
            id: 'test-p1',
            avatarUrl: '1.png',
            seatWind: Wind.East,
            points: 1000
        }, {
            name: 'Player 2',
            id: 'test-p2',
            avatarUrl: '2.png',
            seatWind: Wind.North,
            points: 1000
        }, {
            name: 'Player 3',
            id: 'test-p3',
            avatarUrl: '3.png',
            seatWind: Wind.West,
            points: 1000
        }, {
            name: 'Player 4',
            id: 'test-p4',
            avatarUrl: '4.png',
            seatWind: Wind.South,
            points: 1000
        }
    ];

    private store: DocumentStore;

    connect(playerIndex: PlayerIndex): GameService {
        const playerId = this.playerData[playerIndex].id;
        const gameDocument$ = this.store.get$(this.gameId, playerId);
        const moveProxy = createMoveProxy(this.gameId, playerId, this.store);

        const trainingProxy = new Proxy(moveProxy, {
            get: (target, prop, reciever) => {
                return (...args: unknown[]) => {
                    const valid = !this.useTrainingWheels || (moveValidators as unknown as Record<string | symbol, (...args: unknown[]) => ReturnType<typeof moveValidators['rollDice']>>)[prop]
                        (this.store.get(this.gameId, playerId), playerIndex, ...args);
                    if (valid !== true) {
                        console.warn(valid)
                    } else {
                        return Reflect.get(target, prop, reciever)(...args);
                    }
                }
            }
        })

        return new GameService(this.gameId, this.playerData[playerIndex].id, gameDocument$, trainingProxy);
    }
}