import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve } from "@angular/router";
import { GameService, PlayerIndex } from "@tenfanchombo/game-core";
import { DummyPlayerData, TestServer } from "./test-server";

@Injectable({
    providedIn: 'root',
})
export class GameResolver implements Resolve<GameService> {
    constructor(private readonly testServer: TestServer) {
    }

    async resolve(route: ActivatedRouteSnapshot) {
        return await this.testServer.connect(DummyPlayerData, route.params['gameId'], +route.params['player'] as PlayerIndex);
    }
}
