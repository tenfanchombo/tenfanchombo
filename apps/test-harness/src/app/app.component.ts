import { CommonModule } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { Wind } from '@tenfanchombo/common';
import { TestServer } from './test-server';
import { TableComponent } from './table/table.component';
import { filterLogType, GameService, LogEntry, LogEntryType, PlayerIndex } from '@tenfanchombo/game-core';
import { PlayerSelectComponent } from './player-select/player-select.component';
import { BehaviorSubject, skip, take } from 'rxjs';
import { TileClickBehaviour, TILE_CLICK_BEHAVIOUR } from './state/state';
import { TileClickBehaviourSelectComponent } from './tile-click-behaviour-select/tile-click-behaviour-select.component';


@Component({
    standalone: true,
    imports: [
        CommonModule,
        PlayerSelectComponent,
        TileClickBehaviourSelectComponent,
        TableComponent
    ],
    providers: [
        TestServer,
        {
            provide: TILE_CLICK_BEHAVIOUR,
            useValue: new BehaviorSubject<TileClickBehaviour>(TileClickBehaviour.SplitAfter)
        }
    ],
    selector: 'rth-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent {

    protected activePlayerIndex: PlayerIndex = 0;

    protected readonly testServer = inject(TestServer);
    protected readonly tileClickBehaviour$ = inject<BehaviorSubject<TileClickBehaviour>>(TILE_CLICK_BEHAVIOUR);

    protected readonly playerConnections: GameService[] = [
        this.testServer.connect(0),
        this.testServer.connect(1),
        this.testServer.connect(2),
        this.testServer.connect(3),
    ];

    protected get activeConnection() { return this.playerConnections[this.activePlayerIndex]; }

    constructor() {
        const splits$ = this.playerConnections[0].log$.pipe(filterLogType(LogEntryType.WallSplit));
        splits$.pipe(take(1)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.SplitBefore));
        splits$.pipe(skip(1), take(1)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.Flip));
        this.playerConnections[0].log$.pipe(filterLogType(LogEntryType.FlippedTileInWall)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.Take));
    }


    // protected readonly aiPlayers = [Wind.East, Wind.South, Wind.West, Wind.North]
    //     .filter (w => w !== this.playerWind)
    //     .map(wind => new SimpleAi(wind, this.testServer.connect(wind)));

    protected findDiceRoll(ledger: LogEntry[]) {
        return ledger.filter(le => le.type === LogEntryType.DiceRolled).at(-1) as (LogEntry & {type: LogEntryType.DiceRolled});
    }

    protected die(index: number | undefined | null) {
        // const roll = findInLedger(gameState, LogEntryType.DiceRolled);
        return index == undefined ? '🎲' : String.fromCodePoint(0x267F + index);
    }
}
