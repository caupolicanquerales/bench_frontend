import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NgZone } from '@angular/core';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class SsePostService {
    private authService = inject(AuthService);

    constructor(private ngZone: NgZone) {}

    public connectPost(url: string, body: FormData): Observable<any> {
        return new Observable((observer) => {
        const controller = new AbortController();
        this.ngZone.runOutsideAngular(async () => {
            try {
            const isFormData = body instanceof FormData;
            const headers: Record<string, string> = {};
            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }
            const token = this.authService.token;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: isFormData ? body : JSON.stringify(body),
                signal: controller.signal
            });

            if (!response.ok) {
                this.ngZone.run(() => observer.error(`HTTP Error: ${response.status}`));
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                this.ngZone.run(() => observer.error('ReadableStream not supported'));
                return;
            }

            let currentEventId = '';
            let currentEventName = 'message';
            let lineBuffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                  // Flush any remaining buffered text as a final line
                  if (lineBuffer.trim()) {
                    lineBuffer += '\n';
                  } else {
                    break;
                  }
                }

                const chunk = decoder.decode(value, { stream: true });
                const text = lineBuffer + chunk;

                // Split on newlines; keep the last segment (may be incomplete)
                // as the carry-over buffer for the next iteration.
                const lines = text.split('\n');
                lineBuffer = lines.pop() ?? '';   // last element: potentially partial

                for (const line of lines) {
                if (line.startsWith('id:')) {
                    currentEventId = line.replace('id:', '').trim();
                } else if (line.startsWith('event:')) {
                    currentEventName = line.replace('event:', '').trim();
                } else if (line.startsWith('data:')) {
                    const dataStr = line.replace('data:', '').trim();
                    let parsed: any;
                    try {
                        parsed = JSON.parse(dataStr);
                    } catch {
                        parsed = dataStr;
                    }

                    const eventId = currentEventId;
                    const eventName = currentEventName;
                    this.ngZone.run(() => observer.next({
                        id: eventId,
                        event: eventName,
                        data: parsed,
                        comment: ''
                    }));

                    if (parsed && typeof parsed === 'object' && parsed.message === 'new-message-COMPLETED') {
                        this.ngZone.run(() => observer.complete());
                        controller.abort();
                        return;
                    }
                } else if (line.trim() === '') {
                    currentEventId = '';
                    currentEventName = 'message';
                }
                }

                if (done) break;
            }

            this.ngZone.run(() => observer.complete());
            } catch (error: any) {
            if (error.name !== 'AbortError') {
                this.ngZone.run(() => observer.error(error));
            }
            }
        });

        return () => {
            controller.abort();
        };
        });
    }

}