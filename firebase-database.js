const admin = require('firebase-admin');

class FirebaseDatabase {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Initialize Firebase Admin SDK
            if (!admin.apps.length) {
                // Use environment variables for Firebase config
                const serviceAccount = {
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token",
                    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
                };

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            }

            this.db = admin.firestore();
            this.initialized = true;

            // Seed default data if collections are empty
            await this.seedDefaultData();

            console.log('Connected to Firebase Firestore');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw error;
        }
    }

    async seedDefaultData() {
        try {
            // Check if presets collection is empty
            const presetsSnapshot = await this.db.collection('presets').limit(1).get();
            if (presetsSnapshot.empty) {
                const defaultPreset = {
                    name: 'Default',
                    system_prompt: `You write short, high-signal LinkedIn posts about FOOH (Fake Out Of Home) videos.
Rules:
- Start with a varied HOOK that includes "FOOH".
- Include one-line performance indicator (views & likes).
- Relate directly to what happens in the video.
- Mention the creator(s) or "🎬 Created by [add creator]".
- Add one compact insight about why it worked.
- End with: "Explore more examples in the FOOH Library → fooh.com/library".
- Keep it 4–7 short lines, no hashtags.
- Vary hooks and rhythm so posts never feel repetitive.
When writing the hook, make sure to keep it short, consider mentioning the brand and use best practice on linkedin.
Use at most 1 emoji in the hook.`,
                    output_structure: `Output Structure:
1. Hook with "FOOH" mention
2. Performance metrics line
3. Video description connection
4. Creator attribution
5. Key insight about effectiveness
6. Library link call-to-action

Length: 4-7 short lines
Tone: Professional, engaging
Emojis: Maximum 1 in hook
Hashtags: None`,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                };

                await this.db.collection('presets').add(defaultPreset);
                console.log('Default preset seeded');
            }

            // Check if facts collection is empty
            const factsSnapshot = await this.db.collection('facts').limit(1).get();
            if (factsSnapshot.empty) {
                const defaultFacts = [
                    {
                        fact_text: 'FOOH leverages public places that a lot of people travel to, that are infamous and recognizable, to create a sense of scale and impact.',
                        category: 'Location Strategy',
                        usage_count: 0,
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    },
                    {
                        fact_text: 'The best FOOH campaigns blend seamlessly with their environment, making viewers question if what they\'re seeing is real.',
                        category: 'Creative Strategy',
                        usage_count: 0,
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    },
                    {
                        fact_text: 'FOOH works because it hijacks familiar spaces, creating an unexpected moment that breaks through the noise of traditional advertising.',
                        category: 'Psychology',
                        usage_count: 0,
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    }
                ];

                for (const fact of defaultFacts) {
                    await this.db.collection('facts').add(fact);
                }
                console.log('Default facts seeded');
            }
        } catch (error) {
            console.error('Error seeding default data:', error);
        }
    }

    // Preset methods
    async getAllPresets() {
        const snapshot = await this.db.collection('presets').orderBy('created_at', 'asc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate()?.toISOString() || null,
            updated_at: doc.data().updated_at?.toDate()?.toISOString() || null
        }));
    }

    async getPreset(id) {
        const doc = await this.db.collection('presets').doc(id).get();
        if (!doc.exists) return null;

        return {
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate()?.toISOString() || null,
            updated_at: doc.data().updated_at?.toDate()?.toISOString() || null
        };
    }

    async createPreset(name, systemPrompt, outputStructure) {
        // Check if we already have 5 presets
        const snapshot = await this.db.collection('presets').get();
        if (snapshot.size >= 5) {
            throw new Error('Maximum of 5 presets allowed');
        }

        const preset = {
            name,
            system_prompt: systemPrompt,
            output_structure: outputStructure,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await this.db.collection('presets').add(preset);
        return this.getPreset(docRef.id);
    }

    async updatePreset(id, name, systemPrompt, outputStructure) {
        const docRef = this.db.collection('presets').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Preset not found');
        }

        await docRef.update({
            name,
            system_prompt: systemPrompt,
            output_structure: outputStructure,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return this.getPreset(id);
    }

    async deletePreset(id) {
        // Check if this is the last preset
        const snapshot = await this.db.collection('presets').get();
        if (snapshot.size <= 1) {
            throw new Error('Cannot delete the last remaining preset');
        }

        const docRef = this.db.collection('presets').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Preset not found');
        }

        await docRef.delete();
    }

    // Fact methods
    async getAllFacts() {
        const snapshot = await this.db.collection('facts').orderBy('usage_count', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate()?.toISOString() || null,
            updated_at: doc.data().updated_at?.toDate()?.toISOString() || null
        }));
    }

    async getFact(id) {
        const doc = await this.db.collection('facts').doc(id).get();
        if (!doc.exists) return null;

        return {
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate()?.toISOString() || null,
            updated_at: doc.data().updated_at?.toDate()?.toISOString() || null
        };
    }

    async createFact(factText, category) {
        const fact = {
            fact_text: factText,
            category: category || '',
            usage_count: 0,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await this.db.collection('facts').add(fact);
        return this.getFact(docRef.id);
    }

    async updateFact(id, factText, category) {
        const docRef = this.db.collection('facts').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Fact not found');
        }

        await docRef.update({
            fact_text: factText,
            category: category || '',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return this.getFact(id);
    }

    async deleteFact(id) {
        const docRef = this.db.collection('facts').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Fact not found');
        }

        await docRef.delete();
    }

    async incrementFactUsage(id) {
        const docRef = this.db.collection('facts').doc(id);
        await docRef.update({
            usage_count: admin.firestore.FieldValue.increment(1),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    close() {
        // Firebase Admin SDK doesn't need explicit closing
        console.log('Firebase connection closed');
    }
}

module.exports = FirebaseDatabase;