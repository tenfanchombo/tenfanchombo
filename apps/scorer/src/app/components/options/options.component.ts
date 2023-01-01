import { Component, ViewEncapsulation } from '@angular/core';
import { handFromNotation } from '@tenfanchombo/common';

import { State } from '../../state';

@Component({
    selector: 'scorer-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OptionsComponent {
    constructor(readonly state: State) {
    }

    handFromNotation = handFromNotation;
}
