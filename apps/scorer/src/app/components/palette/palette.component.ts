import { Component } from '@angular/core';
import { createDummySetOfTiles } from '@riichi/common';
import { State, AppendStyle } from '../../state';

@Component({
    selector: 'scorer-palette',
    templateUrl: './palette.component.html',
    styleUrls: ['./palette.component.scss']
})
export class PaletteComponent {

    constructor(readonly state: State) { }

    AppendStyle = AppendStyle;
    allTiles = createDummySetOfTiles();

    updateAppendStyle(event: {target: HTMLInputElement }) {
        console.log(event.target);
        if (event.target.checked) {
            this.state.appendStyle = +event.target.value as AppendStyle;
        }
    }

}
