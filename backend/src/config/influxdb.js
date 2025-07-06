import { InfluxDB } from "@influxdata/influxdb-client";
import {
    INFLUX_URL,
    INFLUX_TOKEN,
    INFLUX_ORG,
    INFLUX_BUCKET,
} from "./appConfig.js";
import { logger } from "./logger.js";

let writeApi = null;
let queryApi = null;
let bucket = null;

if (!INFLUX_URL || !INFLUX_TOKEN || !INFLUX_ORG || !INFLUX_BUCKET) {
    logger.error("InfluxDB environment variables not set. Please check your config.");
    process.exit(1);
}

const client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
writeApi = client.getWriteApi(INFLUX_ORG, INFLUX_BUCKET);
queryApi = client.getQueryApi(INFLUX_ORG);
bucket = INFLUX_BUCKET;

logger.info("InfluxDB client configured successfully.");

export { writeApi, queryApi, bucket };
