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
import { GameService } from '@tenfanchombo/game-core';
import { combineLatest, Subject, takeUntil } from 'rxjs';

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
    
    private renderer: RiichiRenderer | undefined;
    private tilesSourceChange$ = new Subject<void>();

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameService']) {
            this.tilesSourceChange$.next();
            for (let i = 0; i < this.gameService.tiles$array.length; i++) {
                combineLatest([this.gameService.tiles$array[i], this.gameService.wallSplits$]) 
                    .pipe(takeUntil(this.tilesSourceChange$))
                    .subscribe(([ti, splits]) => {
                        this.renderer?.updateTile(i, ti, splits);
                    });
            }
        }
    }

    ngAfterViewInit(): void {
        if (!this.canvasElement) {
            throw new Error('Failed to get reference to canvas element');
        }
        console.log(this.canvasElement);
        this.renderer = new RiichiRenderer(this.canvasElement.nativeElement);
    }

    ngOnDestroy() {
        this.tilesSourceChange$.next();
        this.tilesSourceChange$.complete();
    }
}
