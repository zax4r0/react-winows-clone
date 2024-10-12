// Define a generic interface for event payloads
export type EventPayloadMap = Record<string, any>;

// Define a type-safe BusEvent interface
export type BusEvent<T extends EventPayloadMap, K extends keyof T> = {
    name: K;
    callback: (payload: T[K]) => void;
};

// Type-safe Event Bus class
export class Bus<T extends EventPayloadMap> {
    private pools: Record<string, { [K in keyof T]?: Array<(payload: T[K]) => void> }> = {};

    // Subscribe to an event with type safety
    on<K extends keyof T>(race: string, event: BusEvent<T, K>): () => void {
        if (!this.pools[race]) {
            this.pools[race] = {};
        }

        if (!this.pools[race][event.name]) {
            this.pools[race][event.name] = [];
        }

        // Check if the callback is already subscribed
        const isAlreadySubscribed = this.pools[race][event.name]!.some((callback) => callback === event.callback);

        if (!isAlreadySubscribed) {
            this.pools[race][event.name]!.push(event.callback);
        }

        // Return a function to unsubscribe
        return () => this.remove(race, event.name, event.callback);
    }

    // Emit an event with type safety
    emit<K extends keyof T>(race: string, name: K, payload: T[K]): void {
        const events = this.pools[race]?.[name];

        if (events) {
            events.forEach((callback) => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Error in event ${String(name)}:`, error);
                }
            });
        }
    }

    // Unsubscribe from an event
    remove<K extends keyof T>(race: string, name: K, func: (payload: T[K]) => void): void {
        const racePool = this.pools[race];
        if (racePool) {
            const events = racePool[name];
            if (events) {
                racePool[name] = events.filter((item) => item !== func);
            }
        }
    }

    // Clear all events for a specific race
    clear(race: string): void {
        delete this.pools[race];
    }
}
