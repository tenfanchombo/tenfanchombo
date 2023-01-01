import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { Mahjong } from '@tenfanchombo/common';

@Component({
    selector: 'scorer-mahjong',
    templateUrl: './mahjong.component.html',
    styleUrls: ['./mahjong.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MahjongComponent {
    @Input() mahjong: Mahjong | undefined;
}
