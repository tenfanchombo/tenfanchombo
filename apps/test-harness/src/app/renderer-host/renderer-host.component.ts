import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiichiRenderer } from '@tenfanchombo/renderer';
import { GameService, PlayerIndex } from '@tenfanchombo/game-core';
import { BehaviorSubject, combineLatest, filter, Subject, takeUntil } from 'rxjs';

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
    private tilesSourceChange$ = new Subject<void>();
    private viewReady$ = new BehaviorSubject(false);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameService']) {
            this.tilesSourceChange$.next();
            for (let i = 0; i < this.gameService.tiles$array.length; i++) {
                combineLatest([this.gameService.tiles$array[i], this.gameService.wallSplits$, this.viewReady$.pipe(filter(ready => ready))])
                    .pipe(takeUntil(this.tilesSourceChange$))
                    .subscribe(([ti, splits]) => {
                        this.renderer?.updateTile(i, ti, splits);
                    });
            }
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
            setTimeout(() => this.viewReady$.next(true), 1000);
        });
    }

    ngOnDestroy() {
        this.tilesSourceChange$.next();
        this.tilesSourceChange$.complete();
    }
}
