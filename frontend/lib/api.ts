import { authAPI } from './auth';
import { ResumeParseResponse, PipelineStartRequest, JobRun, Usage } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
    private getHeaders(includeGroq: boolean = false): HeadersInit {
        const token = authAPI.getToken();
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
        };

        if (includeGroq) {
            const groqKey = localStorage.getItem('huntai_groq_key') || '';
            headers['X-Groq-Key'] = groqKey;
        }

        return headers;
    }

    async get<T>(path: string): Promise<T> {
        const headers = this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, { headers });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || 'API request failed');
        }
        return response.json();
    }

    async post<T>(path: string, body: any, includeGroq: boolean = false): Promise<T> {
        const headers = this.getHeaders(includeGroq);
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!response.ok) {
           const error = await response.json().catch(() => ({ detail: response.statusText }))
           throw new Error(error.detail || 'API request failed');
        }
        return response.json();
    }

    async uploadResume(file: File, groqKey: string): Promise<any> {
        const token = authAPI.getToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/parse-resume`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
                'X-Groq-Key': groqKey
            },
            body: formData
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }

    async streamPipeline(
        runId: string, 
        groqKey: string, 
        config: { query: string, location: string, platforms: string[], experience_level: string },
        onEvent: (event: any) => void
    ) {
        const token = authAPI.getToken();
        const url = `${API_BASE_URL}/api/stream/${runId}`;
        const params = new URLSearchParams({
            token: token || '',
            groq_key: groqKey,
            query: config.query,
            location: config.location,
            platforms: config.platforms.join(','),
            experience_level: config.experience_level
        });
        
        const eventSource = new EventSource(`${url}?${params.toString()}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onEvent(data);
        };

        eventSource.onerror = (err) => {
            // Only log actual errors, not closures at the end of a successful run
            if (eventSource.readyState !== EventSource.CLOSED) {
                console.error('SSE connection interrupted:', err);
            }
            eventSource.close();
        };

        return () => eventSource.close();
    }
}

export const api = new ApiClient();
