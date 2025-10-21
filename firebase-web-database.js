const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    increment
} = require('firebase/firestore');

class FirebaseWebDatabase {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Firebase config from your project
            const firebaseConfig = {
                apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBxHKyy1XAdKLkjQCNTuhdieQLtjZnq3hQ",
                authDomain: process.env.FIREBASE_AUTH_DOMAIN || "linkedin-generator-95f96.firebaseapp.com",
                projectId: process.env.FIREBASE_PROJECT_ID || "linkedin-generator-95f96",
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "linkedin-generator-95f96.firebasestorage.app",
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "753617799017",
                appId: process.env.FIREBASE_APP_ID || "1:753617799017:web:5a80c2748e3079f27a9ff8",
                measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-LE6NFS6XT8"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            this.initialized = true;

            // Seed default data if collections are empty
            await this.seedDefaultData();

            console.log('Connected to Firebase Firestore (Web SDK)');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw error;
        }
    }

    async seedDefaultData() {
        try {
            // Check if presets collection is empty
            const presetsRef = collection(this.db, 'presets');
            const presetsSnapshot = await getDocs(query(presetsRef, limit(1)));

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
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };

                await addDoc(presetsRef, defaultPreset);
                console.log('Default preset seeded');
            }

            // Check if facts collection is empty
            const factsRef = collection(this.db, 'facts');
            const factsSnapshot = await getDocs(query(factsRef, limit(1)));

            if (factsSnapshot.empty) {
                const defaultFacts = [
                    {
                        fact_text: 'FOOH leverages public places that a lot of people travel to, that are infamous and recognizable, to create a sense of scale and impact.',
                        category: 'Location Strategy',
                        usage_count: 0,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    },
                    {
                        fact_text: 'The best FOOH campaigns blend seamlessly with their environment, making viewers question if what they\'re seeing is real.',
                        category: 'Creative Strategy',
                        usage_count: 0,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    },
                    {
                        fact_text: 'FOOH works because it hijacks familiar spaces, creating an unexpected moment that breaks through the noise of traditional advertising.',
                        category: 'Psychology',
                        usage_count: 0,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    }
                ];

                for (const fact of defaultFacts) {
                    await addDoc(factsRef, fact);
                }
                console.log('Default facts seeded');
            }
        } catch (error) {
            console.error('Error seeding default data:', error);
        }
    }

    // Helper function to convert Firestore timestamps to ISO strings
    convertTimestamp(timestamp) {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate().toISOString();
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toISOString();
        return null;
    }

    // Preset methods
    async getAllPresets() {
        const presetsRef = collection(this.db, 'presets');
        const q = query(presetsRef, orderBy('created_at', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: this.convertTimestamp(doc.data().created_at),
            updated_at: this.convertTimestamp(doc.data().updated_at)
        }));
    }

    async getPreset(id) {
        const docRef = doc(this.db, 'presets', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            created_at: this.convertTimestamp(docSnap.data().created_at),
            updated_at: this.convertTimestamp(docSnap.data().updated_at)
        };
    }

    async createPreset(name, systemPrompt, outputStructure) {
        // Check if we already have 5 presets
        const presetsRef = collection(this.db, 'presets');
        const snapshot = await getDocs(presetsRef);
        if (snapshot.size >= 5) {
            throw new Error('Maximum of 5 presets allowed');
        }

        const preset = {
            name,
            system_prompt: systemPrompt,
            output_structure: outputStructure,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        };

        const docRef = await addDoc(presetsRef, preset);
        return this.getPreset(docRef.id);
    }

    async updatePreset(id, name, systemPrompt, outputStructure) {
        const docRef = doc(this.db, 'presets', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Preset not found');
        }

        await updateDoc(docRef, {
            name,
            system_prompt: systemPrompt,
            output_structure: outputStructure,
            updated_at: serverTimestamp()
        });

        return this.getPreset(id);
    }

    async deletePreset(id) {
        // Check if this is the last preset
        const presetsRef = collection(this.db, 'presets');
        const snapshot = await getDocs(presetsRef);
        if (snapshot.size <= 1) {
            throw new Error('Cannot delete the last remaining preset');
        }

        const docRef = doc(this.db, 'presets', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Preset not found');
        }

        await deleteDoc(docRef);
    }

    // Fact methods
    async getAllFacts() {
        const factsRef = collection(this.db, 'facts');
        const q = query(factsRef, orderBy('usage_count', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: this.convertTimestamp(doc.data().created_at),
            updated_at: this.convertTimestamp(doc.data().updated_at)
        }));
    }

    async getFact(id) {
        const docRef = doc(this.db, 'facts', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            created_at: this.convertTimestamp(docSnap.data().created_at),
            updated_at: this.convertTimestamp(docSnap.data().updated_at)
        };
    }

    async createFact(factText, category) {
        const fact = {
            fact_text: factText,
            category: category || '',
            usage_count: 0,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        };

        const factsRef = collection(this.db, 'facts');
        const docRef = await addDoc(factsRef, fact);
        return this.getFact(docRef.id);
    }

    async updateFact(id, factText, category) {
        const docRef = doc(this.db, 'facts', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Fact not found');
        }

        await updateDoc(docRef, {
            fact_text: factText,
            category: category || '',
            updated_at: serverTimestamp()
        });

        return this.getFact(id);
    }

    async deleteFact(id) {
        const docRef = doc(this.db, 'facts', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Fact not found');
        }

        await deleteDoc(docRef);
    }

    async incrementFactUsage(id) {
        const docRef = doc(this.db, 'facts', id);
        await updateDoc(docRef, {
            usage_count: increment(1),
            updated_at: serverTimestamp()
        });
    }

    close() {
        // Firebase Web SDK doesn't need explicit closing
        console.log('Firebase connection closed');
    }
}

module.exports = FirebaseWebDatabase;