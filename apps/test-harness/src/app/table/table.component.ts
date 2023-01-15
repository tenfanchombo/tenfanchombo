import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    Input,
    ViewEncapsulation,
} from '@angular/core';
import { Wind } from '@tenfanchombo/common';
import { TileComponent } from '@tenfanchombo/components';
import { DECK_SIZE, GameService, PlayerIndex, TileIndex, TileInfo, TilePosition } from '@tenfanchombo/game-core';
import { BehaviorSubject } from 'rxjs';

import { TileTransformPipe } from '../pipes/tile-transform.pipe';
import { TILE_CLICK_BEHAVIOUR, TileClickBehaviour } from '../state/state';

@Component({
    selector: 'rth-table',
    standalone: true,
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TileComponent, TileTransformPipe]
})
export class TableComponent {
    @Input() gameService!: GameService;
    protected readonly seatIndexes: readonly PlayerIndex[] = [0, 1, 2, 3];

    protected readonly tileClickBehaviour$ = inject<BehaviorSubject<TileClickBehaviour>>(TILE_CLICK_BEHAVIOUR);

    protected readonly windChars: Record<Wind, string> = {
        [Wind.East]: '東',
        [Wind.South]: '南',
        [Wind.West]: '西',
        [Wind.North]: '北',
    };

    protected readonly placeHolders: TileInfo[] =
        new Array(4).fill(1).map((_, seat) => [
            ...new Array(14).fill(1).map((_, hand) => ({
                position: TilePosition.Hand,
                index: hand,
                seat: seat as PlayerIndex,
                rotated: false,
                flipped: false,
                tile: null,
            })),
            ...new Array(24).fill(1).map((_, discard) => ({
                position: TilePosition.Discards,
                index: discard,
                seat: seat as PlayerIndex,
                rotated: false,
                flipped: false,
                tile: null,
            }))
        ]).flat();

    protected clickTile(tileIndex: TileIndex) {
        switch (this.tileClickBehaviour$.value) {
            case TileClickBehaviour.SplitAfter: {
                this.gameService.move.splitWall(tileIndex);
                break;
            }
            case TileClickBehaviour.SplitBefore: {
                this.gameService.move.splitWall((tileIndex + DECK_SIZE - 2) % DECK_SIZE);
                break;
            }
        }
    }
}
