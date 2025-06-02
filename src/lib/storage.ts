
import dotenv from 'dotenv';
import { Pool, type PoolClient } from 'pg';

dotenv.config();

// Define the Storage interface
interface Storage {
  getData(key: string): Promise<any>;
  saveData(key: string, data: any): Promise<void>;
  // Add other data operation methods as needed
}

// Local Storage implementation (in-memory map for server-side fallback)
class LocalStorage implements Storage {
  private data: Map<string, any>;

  constructor() {
    this.data = new Map();
    console.log("Storage System: Using local (in-memory map) storage mode.");
  }

  async getData(key: string): Promise<any> {
    return this.data.get(key);
  }

  async saveData(key: string, data: any): Promise<void> {
    this.data.set(key, data);
  }
}

// Cloud Database Storage implementation (currently PostgreSQL specific)
export class CloudDatabaseStorage implements Storage {
  private pool: Pool;
  private dbType: string;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(dbUrl: string, dbType: string) {
    this.dbType = dbType;
    console.log(`CloudDatabaseStorage Constructor: dbType='${dbType}', dbUrl='${dbUrl ? dbUrl.substring(0, Math.min(dbUrl.length, 50)) + (dbUrl.length > 50 ? '...' : '') : 'EMPTY'}' (length: ${dbUrl ? dbUrl.length : 0})`);
    
    if (!dbUrl) {
      console.error("CloudDatabaseStorage Constructor: dbUrl is empty or undefined. Database operations will likely fail.");
      // Initialize pool with a dummy or handle error, otherwise new Pool might throw immediately or on first connect
      // For now, let it proceed to see the error from new Pool or connect attempt
    }

    this.pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Adjust based on your database provider's SSL requirements
      },
      connectionTimeoutMillis: 5000,
      max: 10, // Example: Max 10 clients in the pool
      idleTimeoutMillis: 30000, // Example: Close idle clients after 30 seconds
    });

    this.pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client in pool', err);
      // process.exit(-1); // Optional: exit if critical
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    console.log(`CloudDatabaseStorage Initialize (${this.dbType}): Starting initialization process.`);
    this.initializationPromise = (async () => {
      let client: PoolClient | null = null;
      try {
        console.log(`CloudDatabaseStorage Initialize (${this.dbType}): Attempting to connect to pool.`);
        client = await this.pool.connect();
        console.log(`CloudDatabaseStorage Initialize (${this.dbType}): Pool client connected successfully.`);
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS storage (
            key VARCHAR(255) PRIMARY KEY,
            value JSONB
          );
        `;
        console.log(`CloudDatabaseStorage Initialize (${this.dbType}): Attempting to execute create table query.`);
        await client.query(createTableQuery);
        console.log(`Storage System: Table "storage" ensured/created successfully in ${this.dbType}.`);
        this.isInitialized = true;
        console.log(`CloudDatabaseStorage Initialize (${this.dbType}): Initialization successful. isInitialized = true.`);
      } catch (err: any) {
        console.error(`CloudDatabaseStorage Initialize (${this.dbType}): FAILED. Error during connect or table creation:`, err.message, err.stack);
        this.initializationPromise = null; // Reset promise on failure to allow retry if applicable
        this.isInitialized = false; // Ensure isInitialized is false on failure
        throw err; // Re-throw error to be caught by caller
      } finally {
        if (client) {
          client.release();
          console.log(`CloudDatabaseStorage Initialize (${this.dbType}): Pool client released after initialization attempt.`);
        }
      }
    })();
    return this.initializationPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      if (!this.initializationPromise) {
        console.warn("CloudDatabaseStorage: ensureInitialized called before initialize(). Attempting to initialize now.");
        await this.initialize(); 
      } else {
        await this.initializationPromise;
      }
    }
    if (!this.isInitialized) {
      throw new Error("CloudDatabaseStorage: Initialization failed and was not retried successfully.");
    }
  }

  async getData(key: string): Promise<any> {
    console.log(`CloudDatabaseStorage getData: Called for key: "${key}"`);
    await this.ensureInitialized();
    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      const query = `
        SELECT value FROM storage
        WHERE key = $1;
      `;
      const result = await client.query(query, [key]);
      return result.rows.length > 0 ? result.rows[0].value : null;
    } catch (error: any) {
      console.error(`Error fetching data from cloud database for key: ${key}`, error.message, error.stack);
      throw error; 
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async saveData(key: string, data: any): Promise<void> {
    console.log(`CloudDatabaseStorage saveData: Called for key: "${key}"`);
    await this.ensureInitialized();
    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      const query = `
        INSERT INTO storage (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value;
      `;
      await client.query(query, [key, data]);
    } catch (error: any) {
      console.error(`Error saving data to cloud database for key: ${key}`, error.message, error.stack);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async disconnect(): Promise<void> {
    console.log(`CloudDatabaseStorage disconnect: Called.`);
    if (this.pool) {
      try {
        await this.pool.end();
        console.log("Cloud database pool disconnected.");
      } catch(closeError: any) {
        console.error("Error closing database pool:", closeError.message);
      }
    }
  }
}

// Singleton instance of storage
let storageInstance: Storage | null = null;
let storageInitializationPromise: Promise<Storage> | null = null;

// Function to get the appropriate storage instance
export async function getStorage(): Promise<Storage> {
  if (storageInstance) {
    // If instance exists and it's CloudDatabaseStorage, ensure it's initialized
    if (storageInstance instanceof CloudDatabaseStorage && !storageInstance['isInitialized']) {
        await storageInstance.initialize();
    }
    return storageInstance;
  }

  if (storageInitializationPromise) {
    return storageInitializationPromise;
  }

  storageInitializationPromise = (async (): Promise<Storage> => {
    console.log('Storage System: Initializing storage instance...');

    const pgUrl = process.env.NEXT_PUBLIC_DATABASE_URL;
    const mysqlUrl = process.env.NEXT_PUBLIC_MYSQL_URL;
    const mongoUrl = process.env.NEXT_PUBLIC_MONGODB_URL;

    if (pgUrl) {
      console.log("Storage System: PostgreSQL URL (NEXT_PUBLIC_DATABASE_URL) found.");
      try {
        const cloudDbStorage = new CloudDatabaseStorage(pgUrl, "PostgreSQL");
        await cloudDbStorage.initialize();
        storageInstance = cloudDbStorage;
        console.log("Storage System: CloudDatabaseStorage (PostgreSQL) initialized and ready.");
        return storageInstance;
      } catch (error: any) {
        console.error("Storage System: Failed to initialize PostgreSQL storage. Falling back.", error.message);
        // Fall through to local storage if cloud init fails
      }
    }
    
    if (mysqlUrl) {
      console.log("Storage System: MySQL URL (NEXT_PUBLIC_MYSQL_URL) found, but MySQL is not yet implemented. Falling back.");
      // Placeholder for MySQL implementation
    }

    if (mongoUrl) {
      console.log("Storage System: MongoDB URL (NEXT_PUBLIC_MONGODB_URL) found, but MongoDB is not yet implemented. Falling back.");
      // Placeholder for MongoDB implementation
    }

    console.log("Storage System: No supported cloud database URL configured, implementation missing, or cloud init failed. Using local (in-memory map) storage as fallback.");
    storageInstance = new LocalStorage();
    return storageInstance;
  })();

  try {
    return await storageInitializationPromise;
  } finally {
    // Clear the promise once resolved or rejected, so subsequent calls re-evaluate.
    // However, for a singleton, we might want to keep the resolved instance.
    // If it failed, then clearing it allows a retry. For simplicity now, let's keep it this way.
    // storageInitializationPromise = null; 
  }
}
