import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { DECK_SIZE, GameService, PlayerIndex, TileIndex, TilePosition } from '@tenfanchombo/game-core';
import { RiichiRenderer } from '@tenfanchombo/renderer';
import { BehaviorSubject, combineLatest, filter, Subject, takeUntil } from 'rxjs';

import { TILE_CLICK_BEHAVIOUR, TileClickBehaviour } from '../state/state';

@Component({
    selector: 'rth-renderer-host',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './renderer-host.component.html',
    styleUrls: ['./renderer-host.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RendererHostComponent implements OnChanges, AfterViewInit, OnDestroy {
    @ViewChild('canvas') private readonly canvasElement!: ElementRef<HTMLCanvasElement>;
    @Input() gameService!: GameService;
    @Input() activeSeat: PlayerIndex = 0;

    private renderer: RiichiRenderer | undefined;
    private gameServiceChange$ = new Subject<void>();
    private viewReady$ = new BehaviorSubject(false);
    protected readonly tileClickBehaviour$ = inject<BehaviorSubject<TileClickBehaviour>>(TILE_CLICK_BEHAVIOUR);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameService']) {
            this.gameServiceChange$.next();
            for (let i = 0; i < this.gameService.tiles$array.length; i++) {
                combineLatest([this.gameService.tiles$array[i], this.gameService.wallSplits$, this.viewReady$.pipe(filter(ready => ready))])
                    .pipe(takeUntil(this.gameServiceChange$))
                    .subscribe(([ti, splits]) => {
                        this.renderer?.updateTile(i, ti, splits);
                    });
            }
            if (this.renderer) {
                this.renderer.gameService = this.gameService;
            }
            this.gameService.diceValues$
                .pipe(takeUntil(this.gameServiceChange$))
                .subscribe((values) => this.renderer?.updateDice(values))
        }
        if (changes['activeSeat'] && this.renderer) {
            this.renderer.moveToSeat(this.activeSeat);
        }
    }

    ngAfterViewInit(): void {
        if (!this.canvasElement) {
            throw new Error('Failed to get reference to canvas element');
        }

        RiichiRenderer.create(this.canvasElement.nativeElement).then(renderer => {
            this.renderer = renderer;
            this.renderer.moveToSeat(this.activeSeat);
            this.renderer.gameService = this.gameService;
            this.renderer.onClickTile = (tileIndex) => this.clickTile(tileIndex);
            this.viewReady$.next(true);
        });
    }

    ngOnDestroy() {
        this.gameServiceChange$.next();
        this.gameServiceChange$.complete();
    }

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
            case TileClickBehaviour.Pickup: {
                this.gameService.move.moveTile(tileIndex, {
                    position: TilePosition.Palm,
                    seat: this.activeSeat, // nice! if we pick another seat, we can move a tile into somebody else's hand
                    index: 0, // could we hold more in our hand?
                    rotated: false,
                    flipped: false
                });
                break;
            }
        }
    }
}
