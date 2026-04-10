import { getCurrentSession } from './supabase';
import { ResumeParseResponse, PipelineStartRequest, JobRun, Usage } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private async getHeaders(includeGroq: boolean = false): Promise<HeadersInit> {
        const session = await getCurrentSession();
        const headers: HeadersInit = {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'Content-Type': 'application/json',
        };

        if (includeGroq) {
            // Groq key is either passed from a form or retrieved from the user's config
            // We assume it's stored in the user profile which can be cached
            const groqKey = localStorage.getItem('huntai_groq_key') || '';
            headers['X-Groq-Key'] = groqKey;
        }

        return headers;
    }

    async get<T>(path: string): Promise<T> {
        const headers = await self.getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, { headers });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }

    async post<T>(path: string, body: any, includeGroq: boolean = false): Promise<T> {
        const headers = await this.getHeaders(includeGroq);
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
        const session = await getCurrentSession();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/parse-resume`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token || ''}`,
                'X-Groq-Key': groqKey
            },
            body: formData
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }

    async streamPipeline(runId: string, groqKey: string, onEvent: (event: any) => void) {
        const session = await getCurrentSession();
        const url = `${API_BASE_URL}/api/stream/${runId}`;
        
        const eventSource = new EventSource(
            `${url}?token=${session?.access_token}&groq_key=${groqKey}`
        );

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onEvent(data);
        };

        eventSource.onerror = (err) => {
            console.error('SSE connection error:', err);
            eventSource.close();
        };

        return () => eventSource.close();
    }
}

export const api = new ApiClient();
