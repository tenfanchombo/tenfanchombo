import {
    ChangeDetectionStrategy,
    Component,
    inject,
    ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DummyPlayerData } from '../test-server';
import { Tile, Wind } from '@tenfanchombo/common';
import { TileComponent } from '@tenfanchombo/components';
import { Router } from '@angular/router';

@Component({
    selector: 'rth-lobby',
    standalone: true,
    imports: [CommonModule, FormsModule, TileComponent],
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent {
    protected gameId = localStorage.getItem('rth-lobby-game-id') ?? 'test-game-1';
    protected playerIndex = +(localStorage.getItem('rth-lobby-player-index') ?? '0');

    protected players = DummyPlayerData;
    private router = inject(Router);

    protected makeWindTile(wind: Wind): Tile {
        return `z${wind}`;
    }

    protected onSubmit() {
        if (this.gameId && [0, 1, 2, 3].includes(this.playerIndex)) {
            localStorage.setItem('rth-lobby-game-id', this.gameId);
            localStorage.setItem('rth-lobby-player-index', this.playerIndex.toString());
            this.router.navigate(['game', this.gameId, this.playerIndex])
        }
    }
}
