import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NgZone } from '@angular/core';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class SseGetService {
    private authService = inject(AuthService);

    constructor(private ngZone: NgZone) {}

    public connectGet(url: string): Observable<any> {
        return new Observable((observer) => {
            const controller = new AbortController();
            let currentEventId = '';
            let currentEventName = 'message';
            let currentData: string[] = [];
            let currentComment = '';
            let lineBuffer = '';

            const emitCurrentEvent = () => {
                if (currentData.length === 0 && !currentComment && !currentEventId && currentEventName === 'message') {
                    return;
                }

                const rawData = currentData.join('\n');
                let parsed: any = rawData;

                if (rawData) {
                    try {
                        parsed = JSON.parse(rawData);
                    } catch {
                        parsed = rawData;
                    }
                }

                this.ngZone.run(() => observer.next({
                    id: currentEventId,
                    event: currentEventName,
                    data: parsed,
                    comment: currentComment
                }));

                if (parsed && typeof parsed === 'object' && parsed.message === 'new-message-COMPLETED') {
                    this.ngZone.run(() => {
                        observer.complete();
                    });
                    controller.abort();
                }
            };

            this.ngZone.runOutsideAngular(async () => {
                try {
                    const headers: Record<string, string> = {
                        Accept: 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        Pragma: 'no-cache'
                    };

                    const token = this.authService.token;
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const response = await fetch(url, {
                        method: 'GET',
                        headers,
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

                    while (true) {
                        const { value, done } = await reader.read();

                        if (done) {
                            if (lineBuffer.trim()) {
                                const lines = (lineBuffer + '\n').split(/\r?\n/);
                                lineBuffer = '';
                                for (const line of lines) {
                                    if (line === '') {
                                        emitCurrentEvent();
                                        currentEventId = '';
                                        currentEventName = 'message';
                                        currentData = [];
                                        currentComment = '';
                                        continue;
                                    }

                                    if (line.startsWith(':')) {
                                        currentComment += `${line.slice(1).trim()}\n`;
                                    } else if (line.startsWith('id:')) {
                                        currentEventId = line.slice(3).trim();
                                    } else if (line.startsWith('event:')) {
                                        currentEventName = line.slice(6).trim() || 'message';
                                    } else if (line.startsWith('data:')) {
                                        currentData.push(line.slice(5).trim());
                                    }
                                }
                            }

                            if (currentData.length > 0 || currentComment || currentEventId || currentEventName !== 'message') {
                                emitCurrentEvent();
                            }

                            this.ngZone.run(() => observer.complete());
                            break;
                        }

                        const chunk = decoder.decode(value, { stream: true });
                        const text = lineBuffer + chunk;
                        const lines = text.split(/\r?\n/);
                        lineBuffer = lines.pop() ?? '';

                        for (const line of lines) {
                            if (line === '') {
                                emitCurrentEvent();
                                currentEventId = '';
                                currentEventName = 'message';
                                currentData = [];
                                currentComment = '';
                                continue;
                            }

                            if (line.startsWith(':')) {
                                currentComment += `${line.slice(1).trim()}\n`;
                                continue;
                            }

                            if (line.startsWith('id:')) {
                                currentEventId = line.slice(3).trim();
                                continue;
                            }

                            if (line.startsWith('event:')) {
                                currentEventName = line.slice(6).trim() || 'message';
                                continue;
                            }

                            if (line.startsWith('data:')) {
                                currentData.push(line.slice(5).trim());
                            }
                        }
                    }
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