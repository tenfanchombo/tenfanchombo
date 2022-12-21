import { CommonModule } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { TestServer } from './test-server';
import { TableComponent } from './table/table.component';
import { filterLogType, GameService, LogEntry, LogEntryType, PlayerIndex } from '@tenfanchombo/game-core';
import { BehaviorSubject, filter, skip, take } from 'rxjs';
import { TileClickBehaviour, TILE_CLICK_BEHAVIOUR } from './state/state';
import { TileClickBehaviourSelectComponent } from './tile-click-behaviour-select/tile-click-behaviour-select.component';
import { RendererHostComponent } from './renderer-host/renderer-host.component';
import { TileComponent } from '@tenfanchombo/components';
import { Tile, Wind } from '@tenfanchombo/common';


@Component({
    standalone: true,
    imports: [
        CommonModule,
        TileComponent,
        TileClickBehaviourSelectComponent,
        TableComponent,
        RendererHostComponent
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
    protected gameId = 'test-game-1';
    protected joiningPlayer = 0;

    protected readonly testServer = inject(TestServer);
    protected readonly tileClickBehaviour$ = inject<BehaviorSubject<TileClickBehaviour>>(TILE_CLICK_BEHAVIOUR);

    protected gameService: GameService | undefined;

    protected async joinGame() {
        this.gameService = await this.testServer.connect(this.gameId, this.joiningPlayer as PlayerIndex);

        const splits$ = this.gameService.log$.pipe(filterLogType(LogEntryType.WallSplit));
        splits$.pipe(take(1), filter(() => this.testServer.useTrainingWheels)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.SplitBefore));
        splits$.pipe(skip(1), take(1), filter(() => this.testServer.useTrainingWheels)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.Flip));
        this.gameService.log$.pipe(filterLogType(LogEntryType.FlippedTile), filter(() => this.testServer.useTrainingWheels)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.Take));
    }

    protected findDiceRoll(ledger: LogEntry[]) {
        return ledger.filter(le => le.type === LogEntryType.DiceRolled).at(-1) as (LogEntry & {type: LogEntryType.DiceRolled});
    }

    protected die(index: number | undefined | null) {
        return index == undefined ? '🎲' : String.fromCodePoint(0x267F + index);
    }

    protected makeWindTile(wind: Wind): Tile {
        return `z${wind}`;
    }
}
