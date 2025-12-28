import { BASE_URL } from "./utils";

export const getAllResources = async () => {
    const res = await fetch(`${BASE_URL}/resources`);
    if (!res.ok) {
        throw new Error('Failed to fetch resources');
    }

    const data = await res.json();
    return data.data;
}

export const getPersonalizedRecommendations = async (token: string) => {
    const res = await fetch(`${BASE_URL}/resources/personalized`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch personalized recommendations');
    }

    const data = await res.json();
    return data.data;
}

export const searchExternalArticles = async (query: string) => {
    const res = await fetch(`${BASE_URL}/resources/search/articles?query=${encodeURIComponent(query)}`);

    if (!res.ok) {
        throw new Error('Failed to search articles');
    }

    const data = await res.json();
    return data.data;
}

export const searchExternalVideos = async (query: string) => {
    const res = await fetch(`${BASE_URL}/resources/search/videos?query=${encodeURIComponent(query)}`);

    if (!res.ok) {
        throw new Error('Failed to search videos');
    }

    const data = await res.json();
    return data.data;
}

export const createResource = async (token: string, data: any) => {
    const res = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Failed to create resource');
    }

    const response = await res.json();
    return response.data;
}

export const importResource = async (token: string, url: string) => {
    const res = await fetch(`${BASE_URL}/resources/import`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
    });

    if (!res.ok) {
        throw new Error('Failed to import resource');
    }

    const response = await res.json();
    return response.data;
}

export const fetchFoodistaFeed = async () => {
    const res = await fetch(`${BASE_URL}/resources/feed/foodista`);

    if (!res.ok) {
        throw new Error('Failed to fetch Foodista feed');
    }

    const data = await res.json();
    return data.data;
}

export const updateResource = async (token: string, id: string, data: any) => {
    const res = await fetch(`${BASE_URL}/resources/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Failed to update resource');
    }

    const response = await res.json();
    return response.data;
}

export const deleteResource = async (token: string, id: string) => {
    const res = await fetch(`${BASE_URL}/resources/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error('Failed to delete resource');
    }
}