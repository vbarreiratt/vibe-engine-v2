import { GoogleAuth } from 'google-auth-library';
import { loadGoogleCredentials } from './google/credentials';

let authClient: any = null;
let projectId: string | null = null;

async function getAuthClient() {
    if (authClient && projectId) return { authClient, projectId };

    try {
        const serviceAccount = loadGoogleCredentials();
        projectId = serviceAccount.project_id;

        const auth = new GoogleAuth({
            credentials: {
                client_email: serviceAccount.client_email,
                private_key: serviceAccount.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        authClient = await auth.getClient();
        return { authClient, projectId };
    } catch (error) {
        console.error("Failed to init Google Auth:", error);
        throw error;
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const { authClient, projectId } = await getAuthClient();

        // Vertex AI Text Embeddings API endpoint
        const location = 'us-central1';
        const model = 'text-embedding-004';
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

        // Get access token
        const accessToken = await authClient.getAccessToken();

        // Make request to Vertex AI
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [
                    {
                        content: text,
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vertex AI API error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        const embedding = result?.predictions?.[0]?.embeddings?.values;

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error("No valid embedding returned from Vertex AI");
        }

        return embedding;
    } catch (error) {
        console.error("Embedding Error (Vertex):", error);
        throw error;
    }
}
