import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { ScoredHand } from '@tenfanchombo/common';

import { State } from '../../state';

@Component({
    selector: 'scorer-computed-hand',
    templateUrl: './computed-hand.component.html',
    styleUrls: ['./computed-hand.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ComputedHandComponent {

    constructor(readonly state: State) { }

    @Input() index: number | undefined;
    @Input() scoredHand: ScoredHand | undefined;

}
