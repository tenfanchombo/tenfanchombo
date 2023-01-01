import { BehaviorSubject, distinctUntilChanged, map, Observable, ReplaySubject, shareReplay } from "rxjs";

import { GameDocument, PlayerIndex, PlayerInfo, TileIndex, TileInfo } from "./documents";
import { filterLogType, LogEntry, LogEntryType } from "./log-entry";
import { MoveFunctions } from "./moves";
import { DECK_SIZE } from "./utils";

export class GameService {
    constructor(
        public readonly gameId: string,
        public readonly playerIndex: PlayerIndex,
        protected readonly playerId: string,
        protected readonly gameDocument$: Observable<GameDocument>,
        public readonly move: MoveFunctions) {

        let logSize = 0;
        const tileSubjects$ = new Array(DECK_SIZE).fill(1).map(() => new ReplaySubject<TileInfo>());
        this.tiles$array = tileSubjects$.map(s => s.pipe(distinctUntilChanged(this.compareTiles), shareReplay(1)));

        const playerSubjects$ = new Array(4).fill(1).map(() => new ReplaySubject<PlayerInfo>(1));
        this.players$ = playerSubjects$.map(s => s.pipe(distinctUntilChanged(/* TODO */), shareReplay(1)));

        const wallSplitsSubject$ = new BehaviorSubject<TileIndex[]>([]);
        this.wallSplits$ = wallSplitsSubject$.asObservable();

        gameDocument$.subscribe(doc => {
            for (let i = 0; i < 4; i++) {
                playerSubjects$[i].next(doc.players[i]);
            }

            for (let i = 0; i < DECK_SIZE; i++) {
                tileSubjects$[i].next(doc.tiles[i]);
            }

            for (; logSize < doc.ledger.length; logSize++) {
                const lastEntry = doc.ledger[logSize];
                this.logSubject$.next(lastEntry);
                if (lastEntry.type === LogEntryType.WallSplit) {
                    wallSplitsSubject$.next([...wallSplitsSubject$.value, lastEntry.afterTile]);
                }
            }
        })
    }

    compareTiles(tileInfoA: TileInfo, tileInfoB: TileInfo) {
        return tileInfoA.position === tileInfoB.position
            && tileInfoA.seat === tileInfoB.seat
            && tileInfoA.index === tileInfoB.index
            && tileInfoA.rotated === tileInfoB.rotated
            && tileInfoA.tile === tileInfoB.tile
            && tileInfoA.public === tileInfoB.public;
    }

    private readonly logSubject$ = new ReplaySubject<LogEntry>();
    readonly log$ = this.logSubject$.asObservable();
    readonly players$: Observable<PlayerInfo>[];

    /**
     * Array of observables with tile info.
     * Each entry in the array represents a single tile
     * */
    readonly tiles$array: Observable<TileInfo>[];
    readonly wallSplits$: Observable<TileIndex[]>;

    readonly diceValues$: Observable<readonly [number, number]> = this.log$.pipe(
        filterLogType(LogEntryType.DiceRolled),
        map(le => le.values)
    );
}
