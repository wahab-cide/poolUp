import { useCallback, useEffect, useState } from "react";

// API Configuration
export const getAPIBaseURL = (): string => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL || 'https://loop-api-gilt.vercel.app';
  console.log('Using API URL:', apiURL);
  return apiURL;
};

// Extract user-friendly error message from API response
const extractUserMessage = (responseText: string | null | undefined): string => {
  try {
    if (!responseText) {
      return 'No response received from server';
    }
    const parsed = JSON.parse(responseText);
    // Return the error message from the API response
    return parsed.error || parsed.message || 'An error occurred';
  } catch {
    // If JSON parsing fails, return a generic message
    return 'An error occurred. Please try again.';
  }
};

export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    // Construct full URL with API base URL
    const baseURL = getAPIBaseURL();
    const fullURL = `${baseURL}${url}`;
    
    // Default headers
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Merge headers
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    };
    
    const response = await fetch(fullURL, mergedOptions);
    const responseText = await response.text();
    
    if (__DEV__) {
      console.log(`[fetchAPI] ${url} - Status: ${response.status}`);
      console.log(`[fetchAPI] Response text:`, responseText ? responseText.substring(0, 200) : 'No response text');
    }
    
    if (!response.ok) {
      // Extract user-friendly error message instead of showing HTTP details
      const userMessage = extractUserMessage(responseText);
      if (__DEV__) {
        console.log(`[fetchAPI] Non-OK response. Status: ${response.status}, Message: ${userMessage}`);
      }
      throw new Error(userMessage);
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid response format. Please try again.');
    }
  } catch (error) {
    if (__DEV__) {
      console.log(`[fetchAPI] Caught error:`, error);
      if (error instanceof Error) {
        console.log(`[fetchAPI] Error message:`, error.message);
        console.log(`[fetchAPI] Error stack:`, error.stack);
      }
    }
    throw error;
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};