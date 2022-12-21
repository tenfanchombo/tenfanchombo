import { initializeApp } from "firebase/app";
import { doc, Firestore, getFirestore, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { InternalGameDocument, createPlayerGameDocument, DocumentStore, GameId } from "@tenfanchombo/server-core";
import { GameDocument } from "@tenfanchombo/game-core";
import { Observable } from "rxjs";

export class TestFirebaseStore implements DocumentStore {
    constructor() {
        const firebaseConfig = {
            apiKey: "AIzaSyC07VxeWOKlNxQ16nIbPgudP81OKPxWSR4",
            authDomain: "tenfanchombo.firebaseapp.com",
            projectId: "tenfanchombo",
            storageBucket: "tenfanchombo.appspot.com",
            messagingSenderId: "987140900837",
            appId: "1:987140900837:web:f150208d2f6189bf44d10c",
            measurementId: "G-SM6MN42MKM"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        this.firestore = getFirestore(app);
    }

    private readonly firestore: Firestore;

    create(gameDocument: InternalGameDocument): GameId {
        throw new Error('not implemented');
    }

    async insertIfDoesNotExist(gameId: string, gameDocument: InternalGameDocument) {
        const docRef = doc(this.firestore, "test-games", gameId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await this.internalUpdate(gameId, gameDocument);
        }
    }

    private async internalUpdate(gameId: string, gameDocument: InternalGameDocument) {
        await setDoc(doc(this.firestore, "test-games", gameId), gameDocument);
        for (const player of gameDocument.players) {
            await setDoc(doc(this.firestore, "test-games", gameId, "players", player.id), createPlayerGameDocument(gameDocument, player.id));
        }
    }

    get$(gameId: string, playerId: string): Observable<GameDocument> {
        return new Observable(subscriber => {
            return onSnapshot(doc(this.firestore, "test-games", gameId, "players", playerId), (doc) => {
                subscriber.next(doc.data() as GameDocument)
            });
        });
    }

    async update(gameId: GameId, updater: (internalGameDocument: InternalGameDocument) => void): Promise<void> {
        const docRef = doc(this.firestore, "test-games", gameId);
        const docSnap = await getDoc(docRef);
        // docSnap.exists()
        const gameDoc = docSnap.data() as InternalGameDocument;
        updater(gameDoc);
        await this.internalUpdate(gameId, gameDoc);
    }
}
