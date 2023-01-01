import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ComputedHandComponent } from './components/computed-hand/computed-hand.component';
import { HandComponent } from './components/hand/hand.component';
import { MahjongComponent } from './components/mahjong/mahjong.component';
import { MeldComponent } from './components/meld/meld.component';
import { OptionsComponent } from './components/options/options.component';
import { PaletteComponent } from './components/palette/palette.component';
import { RadioGroupComponent } from './components/radio-group/radio-group.component';
import { TileComponent } from './components/tile/tile.component';
import { TileButtonComponent } from './components/tile-button/tile-button.component';
import { WaitsComponent } from './components/waits/waits.component';
import { WindInputComponent } from './components/wind-input/wind-input.component';
import { NamePipe } from './pipes/name.pipe';
import { WindPipe } from './pipes/wind.pipe';

@NgModule({
    declarations: [AppComponent, TileComponent, PaletteComponent, TileButtonComponent, HandComponent, ComputedHandComponent, NamePipe, MeldComponent, WaitsComponent, MahjongComponent, WindPipe, WindInputComponent, OptionsComponent, RadioGroupComponent],
    imports: [BrowserModule, FormsModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
