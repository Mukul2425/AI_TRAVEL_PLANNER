import { routes, API_BASE_URL } from './routes';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export async function apiFetch<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers } = options;
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 
        ...defaultHeaders, 
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers 
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    
    throw error;
  }
}

export { routes, API_BASE_URL };

