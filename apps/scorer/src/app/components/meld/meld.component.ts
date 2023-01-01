import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { FinalMeld, OpenMeld } from '@tenfanchombo/common';

import { State } from '../../state';

@Component({
    selector: 'scorer-meld',
    templateUrl: './meld.component.html',
    styleUrls: ['./meld.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeldComponent {
    constructor(readonly state: State) {
    }

    @Input() meld: OpenMeld | FinalMeld | undefined;
    @Input() size: 'normal' | 'small' | 'tiny' = 'normal';

    protected get isfinalSet() {
        return !!(this.meld && 'finalSet' in this.meld && this.meld.finalSet);
    }
}
