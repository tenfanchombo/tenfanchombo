import {
    ChangeDetectionStrategy,
    Component,
    HostBinding,
    Input,
    ViewEncapsulation,
} from '@angular/core';
import { Tile, UnknownTile } from '@tenfanchombo/common';

@Component({
    selector: 'tfc-tile',
    standalone: true,
    template: '',
    styleUrls: ['./tile.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileComponent {
    /**
     * The tile value to display.
     * UnknownTile will display the back of a tile
     * undefined will render a placeholder for the tile
     */
    @HostBinding('attr.data-tile')
    @Input() tile: Tile | UnknownTile | undefined;

    @HostBinding('class.tfc-tile--rotate')
    @Input() rotated = false;
}
