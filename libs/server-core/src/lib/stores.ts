import { GameDocument } from "@tenfanchombo/game-core";
import { BehaviorSubject, map, Observable } from "rxjs";
import { InternalGameDocument } from "./internal/documents";
import { createPlayerGameDocument } from "./server-core";

export type GameId = string;

export interface DocumentStore {
    create(gameDocument: InternalGameDocument): GameId;
    get$(gameId: string, playerId: string): Observable<GameDocument>;
    update(gameId: GameId, updater: (internalGameDocument: InternalGameDocument) => void): Promise<void>;
}

/**
 * An in memory implementatio of a document store.
 * Documents are still serialised at rest, to ensure we behave similar to other stores
 */
export class InMemoryDocumentStore implements DocumentStore {
    private document$Store: Record<GameId, BehaviorSubject<string> | undefined> = {};

    private document$(gameId: GameId) {
        const doc$ = this.document$Store[gameId];
        if (!doc$) { throw new Error(`No game with the id '${gameId}'`); }
        return doc$;
    }

    create(internalGameDocument: InternalGameDocument): GameId {
        const id = `test-game-${Math.random().toString(36).padEnd(13, '0').slice(2)}`;
        this.document$Store[id] = new BehaviorSubject(JSON.stringify(internalGameDocument));
        return id;
    }

    get$(gameId: string, playerId: string): Observable<GameDocument> {
        return this.document$(gameId).pipe(
            map(s => JSON.parse(s)),
            map(doc => createPlayerGameDocument(doc, playerId))
        );
    }

    update(gameId: GameId, updater: (internalGameDocument: InternalGameDocument) => void): Promise<void> {
        const doc$ = this.document$(gameId);
        const value = JSON.parse(doc$.value);
        updater(value);
        doc$.next(JSON.stringify(value));
        return Promise.resolve();
    }
}
