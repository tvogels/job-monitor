#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { ApolloServer, gql } = require("apollo-server-express");
const { MongoClient, ObjectID } = require("mongodb");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const process = require("process");
const express = require("express");

const HEARTBEAT_INTERVAL = 10; // seconds

// const metadataPodName = process.env.JOBMONITOR_METADATA_HOST.toUpperCase().replace("-", "_");
// const metadataHost = process.env[metadataPodName + "_PORT_27017_TCP_ADDR"];
// const metadataPort = process.env[metadataPodName + "_PORT_27017_TCP_PORT"];
// const metadataDb = process.env.JOBMONITOR_METADATA_DB;
// const metadataPassword = process.env.JOBMONITOR_METADATA_PASSWORD;

let metadataHost = process.env.JOBMONITOR_METADATA_HOST;
const metadataPort = process.env.JOBMONITOR_METADATA_PORT;
const metadataDb = process.env.JOBMONITOR_METADATA_DB;
const metadataUser = process.env.JOBMONITOR_METADATA_USER || "root";
const metadataPassword = process.env.JOBMONITOR_METADATA_PASS;

let mongo;

// The GraphQL schema
const typeDefs = gql`
    scalar Date
    scalar Object
    scalar Dictionary

    type Job {
        id: ID!
        user: String!
        project: String!
        experiment: String!
        job: String!
        status: Status!
        host: String
        outputDirectory: String
        creationTime: Date!
        startTime: Date
        endTime: Date
        logs: String
        config: [Config]
        annotations: [Annotation]
        "If an error occurred (status=FAILED), this is a string representation of you the exception"
        exception: String
        environment: Environment!
        "Get timeseries that satisfy zero or more requirements (strings accept regex)"
        timeseries(measurement: String, tags: String): [Timeseries]
        "How close to done are we?"
        progress: Float
        textFile(filename: String!): String
        jsonFile(filename: String!): Dictionary
        images: [Image]
    }
    enum Status {
        CREATED
        QUEUE
        SCHEDULED
        RUNNING
        FINISHED
        CANCELED
        FAILED
        UNRESPONSIVE
    }
    type Image {
        key: String!
        path: String!
    }
    type Config {
        key: String
        value: Object
    }
    type Annotation {
        key: String
        value: Object
    }
    type CloneConfiguration {
        path: String
    }
    type Environment {
        script: String
        clone: CloneConfiguration
    }
    type ValueList {
        key: String
        value: Float
    }
    type Timeseries {
        measurement: String!
        tags: Dictionary!
        values: [Dictionary]
        currentValue: Dictionary!
        maxValue: Dictionary!
        minValue: Dictionary!
        jobId: ID!
    }
    type Query {
        "Get a job entry by ID"
        job(id: ID!): Job
        "Get a list of jobs satisfying the specified criteria. 'job' allows for regex"
        jobs(
            ids: [ID]
            user: String
            project: String
            experiment: String
            job: String
            search: String
            status: Status
            limit: Int
        ): [Job]
    }
    type Mutation {
        "Change a specific annotation on a job"
        setAnnotation(jobId: ID!, key: String!, value: Object): Job
    }
`;

// A map of functions which return data for the schema.
const resolvers = {
    Query: {
        job: (root, args, context, info) => {
            return mongo
                .collection("job")
                .findOne({ _id: ObjectID(args.id) })
                .then(parseJobFromDatabase);
        },
        jobs: (root, args, context, info) => {
            const limit = args.limit || 0;
            delete args.limit;
            const ids = args.ids;
            delete args.ids;
            const search = args.search;
            delete args.search;
            const status = args.status;
            delete args.status;
            const query = {
                $and: [args, statusQuery(status), searchQuery(search), idsQuery(ids)]
            };
            // console.log(JSON.stringify(query));
            return mongo
                .collection("job")
                .find(query)
                .project({
                    annotations: 1,
                    config: 1,
                    creation_time: 1,
                    end_time: 1,
                    environment: 1,
                    exception: 1,
                    experiment: 1,
                    host: 1,
                    images: 1,
                    initialization: 1,
                    job: 1,
                    output_dir: 1,
                    project: 1,
                    start_time: 1,
                    state: 1,
                    user: 1
                })
                .sort({ creation_time: -1 })
                .limit(limit)
                .toArray()
                .then(entries => entries.filter(postHocSearchFilter(search)).map(parseJobFromDatabase));
        }
    },
    Mutation: {
        setAnnotation: (root, args, context, info) => {
            const idQuery = { _id: ObjectID(args.jobId) };
            let update;
            if (args.value != null) {
                update = { $set: { ["annotations." + args.key]: args.value } };
            } else {
                update = { $unset: { ["annotations." + args.key]: "" } };
            }
            return mongo
                .collection("job")
                .updateOne(idQuery, update)
                .then(() => mongo.collection("job").findOne(idQuery))
                .then(parseJobFromDatabase);
        }
    },
    Job: {
        logs: (job, args, context, info) => {
            return mongo
                .collection("job")
                .findOne({ _id: ObjectID(job.id) }, { projection: { logs: true } })
                .then(jobdata => {
                    if (jobdata["logs"] != null) {
                        // Read from the database
                        return jobdata["logs"]
                            .filter(j => j.worker === 0)
                            .map(j => j.message)
                            .join("\n");
                    } else {
                        // Read from a logfile
                        if (job.outputDirectory == null) return null;
                        const logFile = path.join(
                            process.env.JOBMONITOR_RESULTS_DIR,
                            job.outputDirectory,
                            "output.txt"
                        );
                        if (!fs.existsSync(logFile)) return null;
                        return new Promise((resolve, reject) =>
                            fs.readFile(logFile, "utf8", (err, value) => {
                                if (err) reject(err);
                                resolve(value);
                            })
                        );
                    }
                });
        },
        textFile: (job, args, context, info) => {
            const filename = args["filename"];
            const filepath = path.join(process.env.JOBMONITOR_RESULTS_DIR, job.outputDirectory, filename);
            if (!fs.existsSync(filepath)) return null;
            return new Promise((resolve, reject) =>
                fs.readFile(filepath, "utf8", (err, value) => {
                    if (err) reject(err);
                    resolve(value);
                })
            );
        },
        jsonFile: (job, args, context, info) => {
            const filename = args["filename"];
            const filepath = path.join(process.env.JOBMONITOR_RESULTS_DIR, job.outputDirectory, filename);
            if (!fs.existsSync(filepath)) return null;
            return new Promise((resolve, reject) =>
                fs.readFile(filepath, "utf8", (err, value) => {
                    if (err) reject(err);
                    resolve(value);
                })
            ).then(JSON.parse);
        },
        timeseries: (job, args, context, info) => {
            const fromQuery = args.measurement != null ? `FROM /${args.measurement}/` : "";
            let conditions = (args.tags || "")
                .split(",")
                .filter(x => x != "")
                .map(condition => condition.split("="));

            return mongo
                .collection("job")
                .findOne({ _id: ObjectID(job.id) }, { projection: { metrics: true } })
                .then(jobdata => {
                    let metrics = jobdata["metrics"] || [];
                    return metrics
                        .filter(t => {
                            if (args.measurement) {
                                const regex = new RegExp("^" + args.measurement + "$");
                                if (!t.measurement.match(regex)) {
                                    return false;
                                }
                            }
                            for (let [key, val] of conditions) {
                                if (`${t[key]}` !== `${val}`) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map(t => {
                            const tags = {};
                            for (let key of Object.keys(t)) {
                                if (!["id", "measurement"].includes(key)) {
                                    tags[key] = t[key];
                                }
                            }
                            return { measurement: t.measurement, tags, jobId: job.id, id: t.id };
                        });
                });
        }
    },
    Timeseries: {
        values: getValueFromTimeseries("ALL"),
        currentValue: getValueFromTimeseries("LAST"),
        maxValue: getValueFromTimeseries("MAX"),
        minValue: getValueFromTimeseries("MIN")
    },
    Date: new GraphQLScalarType({
        name: "Date",
        description: "Milliseconds since 1970",
        parseValue(value) {
            return new Date(value);
        },
        serialize(value) {
            return value.getTime();
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return new Date(ast.value);
            } else {
                return null;
            }
        }
    }),
    Object: new GraphQLScalarType({
        name: "Object",
        description: "Arbitrary object",
        parseValue: value => {
            try {
                return JSON.parse(value);
            } catch (error) {
                // Then it's probably a string
                return value;
            }
        },
        serialize: value => {
            if (typeof value === "object") {
                return JSON.stringify(value);
            } else {
                return value;
            }
        },
        parseLiteral: ast => {
            if (ast.kind === Kind.STRING) {
                try {
                    return JSON.parse(ast.value);
                } catch (err) {
                    return ast.value;
                }
            } else {
                return ast.value;
            }
        }
    }),
    Dictionary: new GraphQLScalarType({
        name: "Dictionary",
        description: "Object with string keys and numeric values",
        parseValue: value => {
            return value;
        },
        serialize: value => {
            return value;
        },
        parseLiteral: ast => {
            if (ast.kind === Kind.OBJECT) {
                return ast.value;
            } else {
                return null;
            }
        }
    })
};

/**
 * Turn a MongoDB record into the desired output format for GraphQL queries
 */
function parseJobFromDatabase(entry) {
    return {
        id: entry._id.toString(),
        user: entry.user,
        project: entry.project,
        experiment: entry.experiment,
        job: entry.job,
        status: jobStatus(entry),
        host: entry.host,
        outputDirectory: entry.output_dir,
        creationTime: entry.creation_time,
        startTime: entry.start_time,
        endTime: entry.end_time,
        config: Object.entries(entry.config || {}).map(([k, v]) => ({ key: k, value: v })),
        exception: entry.exception,
        annotations: Object.entries(entry.annotations || {}).map(([k, v]) => ({ key: k, value: v })),
        environment: entry.environment || entry.initialization,
        progress: (entry.state || {}).progress,
        images: entry.images ? Object.entries(entry.images).map(([key, path]) => ({ key, path })) : []
    };
}

/**
 * Construct a MongoDB query for a desired `STATUS`
 * For the desired status `RUNNING` or `UNRESPONSIVE`, we need to take the heartbeat into account
 * For any other status, we can directly filter on the job's `status` field.
 * @param {string} status
 */
function statusQuery(status) {
    let statusSearch = {};
    const heartbeatThreshold = new Date(Date.now() - 2 * HEARTBEAT_INTERVAL * 1000);
    if (status === "UNRESPONSIVE") {
        statusSearch["status"] = "RUNNING";
        statusSearch["last_heartbeat_time"] = { $lte: heartbeatThreshold };
    } else if (status === "RUNNING") {
        statusSearch["status"] = "RUNNING";
        statusSearch["last_heartbeat_time"] = { $gt: heartbeatThreshold };
    } else if (status === "QUEUE") {
        return { $or: [statusQuery("RUNNING"), statusQuery("CREATED"), statusQuery("SCHEDULED")] };
    } else if (status) {
        statusSearch["status"] = status;
    }
    return statusSearch;
}

/**
 * Construct a MongoDB query that finds jobs that have any of the requested IDs.
 * @param {string[]} ids
 */
function idsQuery(ids) {
    if (ids == null) {
        return {};
    } else {
        return { _id: { $in: ids.map(id => ObjectID(id)) } };
    }
}

/**
 * Figures out if a search query should be handled 'specific' (by a post-hoc javascript-based filter)
 * or 'fuzzy' (by MongoDB)
 * @param {string} query
 */
const isSpecificSearch = query => query.indexOf("js:") == 0;

/**
 * Generate a fuzzy MongoDB query for a given search string
 * If the query starst with 'js:', precise searching should be activated.
 * Precise searching is not handled by mongoDB, but by a post-hoc filter executed after
 * the results are returned.
 * @param {string} query
 */
function searchQuery(query) {
    if (query == null) return {};
    if (isSpecificSearch(query)) {
        // We will filter post-hoc
        return {};
    } else {
        // General search
        return {
            $or: [
                { job: { $regex: query } },
                { experiment: { $regex: query } },
                { "annotations.description": { $regex: query } }
            ]
        };
    }
}
/**
 * Create a filter function for precise querying
 *
 * If the input query starts with "js:", we create a filter that evaluates the
 * boolean expression that follows in the context of a job.
 * If the expression fails to compile or throws errors, the filter always returns false.
 * If the input query doesn't start with "js:", the filter should not exclude anything.
 *
 * @param {string} query
 */
function postHocSearchFilter(query) {
    if (query != null && isSpecificSearch(query)) {
        const expression = query.substr(3);
        try {
            return new Function(
                "job",
                `try {
                // Add job variable to the local filter function scope
                if (job.config != null) {
                    Object.entries(job.config).forEach(([key, value]) => {
                        this[key] = value;
                    });
                }
                Object.entries(job).forEach(([key, value]) => {
                    this[key] = value;
                });
                // Run the user's experssion
                return ${expression};
            } catch (err) {
                // Return no results if an error occurred.
                return false;
            }`
            );
        } catch (err) {
            console.error(err);
            return () => false;
        }
    } else {
        // No Filtering
        return () => true;
    }
}

/**
 * Derive the current job status from a MongoDB entry
 *
 * If MongoDB thinks the job is running, we check if the heartbeat is up to date.
 * If the heartbeat is too old, we return 'UNRESPONSIVE'
 * @param {{ status: string, last_heartbeat_time: DateTime }} entry
 */
function jobStatus(entry) {
    // Job status from a database entry
    let status = entry.status;
    if (status === "RUNNING") {
        // Check if there has been a heartbeat recently
        const timeSinceLastHeartbeat = Date.now() - entry.last_heartbeat_time;
        const probablyDead = timeSinceLastHeartbeat > 2 * HEARTBEAT_INTERVAL * 1000;
        if (probablyDead) {
            status = "UNRESPONSIVE";
        }
    }
    return status;
}

/**
 * Create a resolver that finds an aggregate value (max, min, last, ...) from a timeseries in InfluxDB
 * @param {'MAX' | 'MIN' | 'LAST' | 'ALL'} operator
 */
function getValueFromTimeseries(operator) {
    return (timeseries, args, context, info) => {
        const { measurement, jobId, id, tags } = timeseries;
        const key = `metric_data.${id}`;
        const projection = {};
        projection[key] = true;
        return mongo
            .collection("job")
            .findOne({ _id: ObjectID(jobId) }, { projection })
            .then(jobdata => {
                const data = jobdata["metric_data"][id].map(e => ({
                    ...e,
                    time: e.time.getTime()
                }));
                if (operator === "ALL") {
                    return data;
                } else if (operator === "LAST") {
                    return data[data.length - 1];
                } else if (operator === "MIN") {
                    let min = { value: Number.POSITIVE_INFINITY };
                    data.forEach(d => {
                        if (d.value < min.value) {
                            min = d;
                        }
                    });
                    return min;
                } else if (operator === "MAX") {
                    let max = { value: Number.NEGATIVE_INFINITY };
                    data.forEach(d => {
                        if (d.value > max.value) {
                            max = d;
                        }
                    });
                    return max;
                }
            });
    };
}

const app = express();

const server = new ApolloServer({ typeDefs, resolvers, cors: { origin: true } });
server.applyMiddleware({ app, path: "/graphql" });

/** Handler for serving the files stored in the job's result directories */
app.get("/file/:jobId*", function(req, res, next) {
    const jobId = req.params.jobId;
    const subpath = req.params["0"];

    mongo
        .collection("job")
        .findOne({ _id: ObjectID(jobId) }, { projection: { output_dir: true } })
        .then(job => {
            if (job == null) return next("Job not found");
            const { output_dir } = job;
            const fullPath = path.join(process.env.JOBMONITOR_RESULTS_DIR, output_dir, subpath);
            if (!fs.existsSync(fullPath)) return next("File not found");
            res.sendFile(fullPath);
        })
        .catch(err => next(err));
});

// HACKY MESS:
if (!metadataHost.includes("//")) {
    metadataHost = `mongodb://${metadataHost}`;
}
let mongoUrl = `${metadataHost}:${metadataPort}/${metadataDb}`;
if (metadataPassword != null) {
    mongoUrl = mongoUrl.replace("://", `://${metadataUser}:${encodeURIComponent(metadataPassword)}@`);
}
if (metadataHost.includes("mongodb+srv")) {
    mongoUrl = mongoUrl.replace(`:${metadataPort}`, "");
}

const tcpPort = 4000;
MongoClient.connect(mongoUrl, {
    useNewUrlParser: true
})
    .then(db => (mongo = db.db()))
    .then(() => app.listen(tcpPort))
    .then(({ url }) => {
        console.log(`🚀 Server ready at port ${tcpPort}`);
    });
