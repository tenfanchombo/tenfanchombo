import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { ScoredHand, Tile } from '@tenfanchombo/common';

import { State } from '../../state';

@Component({
    selector: 'scorer-waits',
    templateUrl: './waits.component.html',
    styleUrls: ['./waits.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitsComponent {
    constructor(readonly state: State) {
    }

    @Input() waits: { tile: Tile, result: ScoredHand }[] | undefined;
}
