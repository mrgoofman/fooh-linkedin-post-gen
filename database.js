const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - will be created in the project directory
const dbPath = path.join(__dirname, 'presets.db');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const createPresetsTable = `
            CREATE TABLE IF NOT EXISTS presets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                system_prompt TEXT NOT NULL,
                output_structure TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createFactsTable = `
            CREATE TABLE IF NOT EXISTS fooh_facts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fact_text TEXT NOT NULL,
                category TEXT DEFAULT '',
                usage_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return new Promise((resolve, reject) => {
            this.db.run(createPresetsTable, (err) => {
                if (err) {
                    console.error('Error creating presets table:', err);
                    reject(err);
                } else {
                    console.log('Presets table ready');
                    this.db.run(createFactsTable, (err) => {
                        if (err) {
                            console.error('Error creating facts table:', err);
                            reject(err);
                        } else {
                            console.log('Facts table ready');
                            this.seedDefaultData().then(resolve).catch(reject);
                        }
                    });
                }
            });
        });
    }

    async seedDefaultData() {
        await this.seedDefaultPreset();
        await this.seedDefaultFacts();
    }

    async seedDefaultPreset() {
        const defaultSystemPrompt = `You write short, high-signal LinkedIn posts about FOOH (Fake Out Of Home) videos.
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
Use at most 1 emoji in the hook.`;

        const defaultOutputStructure = `Output Structure:
1. Hook with "FOOH" mention
2. Performance metrics line
3. Video description connection
4. Creator attribution
5. Key insight about effectiveness
6. Library link call-to-action

Length: 4-7 short lines
Tone: Professional, engaging
Emojis: Maximum 1 in hook
Hashtags: None`;

        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM presets WHERE name = 'Default'", (err, row) => {
                if (err) {
                    reject(err);
                } else if (row.count === 0) {
                    this.db.run(
                        "INSERT INTO presets (name, system_prompt, output_structure) VALUES (?, ?, ?)",
                        ['Default', defaultSystemPrompt, defaultOutputStructure],
                        (err) => {
                            if (err) {
                                console.error('Error seeding default preset:', err);
                                reject(err);
                            } else {
                                console.log('Default preset seeded');
                                resolve();
                            }
                        }
                    );
                } else {
                    resolve();
                }
            });
        });
    }

    async getAllPresets() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM presets ORDER BY created_at ASC", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getPreset(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM presets WHERE id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async createPreset(name, systemPrompt, outputStructure) {
        return new Promise((resolve, reject) => {
            // Check if we already have 5 presets
            this.db.get("SELECT COUNT(*) as count FROM presets", (err, row) => {
                if (err) {
                    reject(err);
                } else if (row.count >= 5) {
                    reject(new Error('Maximum of 5 presets allowed. Please delete one before creating a new preset.'));
                } else {
                    this.db.run(
                        "INSERT INTO presets (name, system_prompt, output_structure) VALUES (?, ?, ?)",
                        [name, systemPrompt, outputStructure],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ id: this.lastID, name, systemPrompt, outputStructure });
                            }
                        }
                    );
                }
            });
        });
    }

    async updatePreset(id, name, systemPrompt, outputStructure) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE presets SET name = ?, system_prompt = ?, output_structure = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [name, systemPrompt, outputStructure, id],
                function(err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        reject(new Error('Preset not found'));
                    } else {
                        resolve({ id, name, systemPrompt, outputStructure });
                    }
                }
            );
        });
    }

    async deletePreset(id) {
        return new Promise((resolve, reject) => {
            // Don't allow deleting if it's the last preset
            this.db.get("SELECT COUNT(*) as count FROM presets", (err, row) => {
                if (err) {
                    reject(err);
                } else if (row.count <= 1) {
                    reject(new Error('Cannot delete the last remaining preset'));
                } else {
                    this.db.run("DELETE FROM presets WHERE id = ?", [id], function(err) {
                        if (err) {
                            reject(err);
                        } else if (this.changes === 0) {
                            reject(new Error('Preset not found'));
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }

    async seedDefaultFacts() {
        const defaultFacts = [
            "FOOH leverages public places that a lot of people travel to, that are infamous and/or happen to be in media and movies often. Something impossible is added using CGI. The combination of something familiar with something impossible makes it engaging.",
            "Scale illusions work best when integrated with iconic landmarks that provide instant size reference and context for viewers.",
            "Urban environments provide perfect backdrops for FOOH because of high foot traffic and multiple viewing angles that create authentic reactions.",
            "Color contrast is crucial in FOOH - bright, unexpected colors against neutral city backdrops create immediate visual impact and stopping power.",
            "Movement and transformation elements in FOOH (like objects opening, growing, or changing) create memorable moments that drive engagement.",
            "FOOH works because it hijacks familiar spaces and adds the impossible, creating cognitive dissonance that captures attention and drives shares."
        ];

        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM fooh_facts", (err, row) => {
                if (err) {
                    reject(err);
                } else if (row.count === 0) {
                    const insertPromises = defaultFacts.map(fact => {
                        return new Promise((resolveInsert, rejectInsert) => {
                            this.db.run(
                                "INSERT INTO fooh_facts (fact_text) VALUES (?)",
                                [fact],
                                (err) => {
                                    if (err) {
                                        rejectInsert(err);
                                    } else {
                                        resolveInsert();
                                    }
                                }
                            );
                        });
                    });

                    Promise.all(insertPromises)
                        .then(() => {
                            console.log('Default facts seeded');
                            resolve();
                        })
                        .catch(reject);
                } else {
                    resolve();
                }
            });
        });
    }

    // Facts management methods
    async getAllFacts() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM fooh_facts ORDER BY usage_count DESC, created_at DESC", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getFact(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM fooh_facts WHERE id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async createFact(factText, category = '') {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO fooh_facts (fact_text, category) VALUES (?, ?)",
                [factText, category],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, factText, category });
                    }
                }
            );
        });
    }

    async updateFact(id, factText, category = '') {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE fooh_facts SET fact_text = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [factText, category, id],
                function(err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        reject(new Error('Fact not found'));
                    } else {
                        resolve({ id, factText, category });
                    }
                }
            );
        });
    }

    async deleteFact(id) {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM fooh_facts WHERE id = ?", [id], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Fact not found'));
                } else {
                    resolve();
                }
            });
        });
    }

    async incrementFactUsage(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE fooh_facts SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [id],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;