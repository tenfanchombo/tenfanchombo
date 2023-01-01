import {
    ChangeDetectionStrategy,
    Component,
    inject,
    ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { filterLogType, GameService, LogEntry, LogEntryType } from '@tenfanchombo/game-core';
import { take, filter, skip, BehaviorSubject } from 'rxjs';
import { TileClickBehaviour, TILE_CLICK_BEHAVIOUR } from '../state/state';
import { TestServer } from '../test-server';
import { RendererHostComponent } from '../renderer-host/renderer-host.component';
import { TileClickBehaviourSelectComponent } from '../tile-click-behaviour-select/tile-click-behaviour-select.component';
import { TableComponent } from '../table/table.component';

@Component({
    selector: 'rth-game',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RendererHostComponent,
        TileClickBehaviourSelectComponent,
        TableComponent
    ],
    providers: [
        {
            provide: TILE_CLICK_BEHAVIOUR,
            useValue: new BehaviorSubject<TileClickBehaviour>(TileClickBehaviour.SplitAfter)
        }
    ],
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent {
    constructor(activatedRoute: ActivatedRoute) {
        activatedRoute.data.subscribe(data => {
            this.gameService = data['game'];
            if (this.gameService) {
                const splits$ = this.gameService.log$.pipe(filterLogType(LogEntryType.WallSplit));
                splits$.pipe(take(1), filter(() => this.testServer.useTrainingWheels)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.SplitBefore));
                splits$.pipe(skip(1), take(1), filter(() => this.testServer.useTrainingWheels)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.Flip));
                this.gameService.log$.pipe(filterLogType(LogEntryType.FlippedTile), filter(() => this.testServer.useTrainingWheels)).subscribe(() => this.tileClickBehaviour$.next(TileClickBehaviour.Take));
            }
        });
    }

    protected testServer = inject(TestServer);
    protected readonly tileClickBehaviour$ = inject<BehaviorSubject<TileClickBehaviour>>(TILE_CLICK_BEHAVIOUR);
    protected gameService: GameService | undefined;

    protected findDiceRoll(ledger: LogEntry[]) {
        return ledger.filter(le => le.type === LogEntryType.DiceRolled).at(-1) as (LogEntry & {type: LogEntryType.DiceRolled});
    }

    protected die(index: number | undefined | null) {
        return index == undefined ? '🎲' : String.fromCodePoint(0x267F + index);
    }
}
