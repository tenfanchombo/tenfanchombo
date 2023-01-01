import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, UrlSegment } from '@angular/router';

import { AppComponent } from './app/app.component';
import { GameResolver } from './app/game.resolver';
import { GameComponent } from './app/game/game.component';
import { LobbyComponent } from './app/lobby/lobby.component';
import { TestServer } from './app/test-server';

bootstrapApplication(AppComponent, {
    providers: [
        TestServer,
        provideRouter([
            {
                matcher: (url: UrlSegment[]) => {
                    if (url.length === 3 && url[0].path === 'game' && url[2].path.match(/^[0123]$/)) {
                        return {
                            consumed: url,
                            posParams: {
                                gameId: url[1],
                                player: url[2]
                            }
                        };
                    }
                    return null;
                },
                component: GameComponent,
                resolve: {
                    game: GameResolver
                }
            },
            {
                path: '',
                component: LobbyComponent
            }
        ])
    ]
}).catch((err) => console.error(err));
