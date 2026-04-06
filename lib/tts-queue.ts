// lib/tts-queue.ts
// ✅ Queue globale singleton — persiste entre les requêtes Next.js (same process)
// Garantit qu'un seul appel Fonada tourne à la fois, tous chapitres confondus.

type Job<T> = () => Promise<T>;

class TTSQueue {
  private queue: Array<() => void> = [];
  private running = false;
  private minDelayMs: number;

  constructor(minDelayMs = 8000) {
    // 8 secondes minimum entre chaque appel Fonada
    this.minDelayMs = minDelayMs;
  }

  async add<T>(job: Job<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await job();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.run();
    });
  }

  private async run() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      await job();

      if (this.queue.length > 0) {
        console.log(`⏳ TTS Queue: pause ${this.minDelayMs}ms avant le prochain appel...`);
        await new Promise((res) => setTimeout(res, this.minDelayMs));
      }
    }

    this.running = false;
  }
}

// ✅ Singleton global (partagé entre toutes les routes Next.js dans le même process)
const globalForQueue = global as unknown as { ttsQueue: TTSQueue };
export const ttsQueue = globalForQueue.ttsQueue ?? new TTSQueue(8000);
if (!globalForQueue.ttsQueue) globalForQueue.ttsQueue = ttsQueue;