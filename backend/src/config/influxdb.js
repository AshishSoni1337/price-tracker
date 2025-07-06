import { InfluxDB } from '@influxdata/influxdb-client';
import 'dotenv/config';

const url = process.env.INFLUXDB_URL;
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG;
export const bucket = process.env.INFLUXDB_BUCKET;

if (!url || !token || !org || !bucket) {
    console.error("InfluxDB environment variables not set. Please check your .env file.");
    process.exit(1); 
}

const client = new InfluxDB({ url, token });

export const writeApi = client.getWriteApi(org, bucket);
export const queryApi = client.getQueryApi(org);

console.log('InfluxDB client configured.'); 
