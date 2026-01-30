const API_URL = import.meta.env.PUBLIC_API_URL;

export async function fetchAPI(query = '') {
    const res = await fetch(`${API_URL}/${query}`);

    if (res.ok) {
        return res.json();
    } else {
        const error = await res.json();

        throw new Error(
            '❗ Failed to fetch API for ' + query + "\n" +
            'Code: ' + error.code + "\n" +
            'Message: ' + error.message + "\n"
        );
    }
}

// Cache for API responses to avoid duplicate fetches during build
const apiCache = new Map();

export async function getArticles(cat) {
    // Check cache first
    if (apiCache.has(cat)) {
        console.log(`[CACHE HIT] Articles for category ${cat}`);
        return apiCache.get(cat);
    }

    console.log(`[FETCHING] Articles for category ${cat}`);
    const data = await fetchAPI('posts?_embed&per_page=100&categories=' + cat);

    // Store in cache
    apiCache.set(cat, data);
    return data;
}

/*export async function conn() {
    const res = await fetch('',{

    });

    if ( res.ok ) {
        return res.json();
    } else {
        const error = await res.json();

        throw new Error(
            '❗ Failed to fetch API for ' + query + "\n" +
            'Code: ' + error.code + "\n" +
            'Message: ' + error.message + "\n"
        );
    }
}*/